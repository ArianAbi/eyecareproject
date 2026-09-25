"use server"

import { actionResult, ExpectedError } from "../action-result";
import { productSnapshot } from "../order-snapshot";
import { assertOrderEligibility, cartInputSchema, storedPrescription, lensPrice } from "../lens-policy"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import prisma from "../db"
import { requireAdmin } from "../access"
import { writeAudit } from "../audit"
import { chargeOrderCredit } from "../order-credit"
import type { CartItemProductItemType } from "@/types/order"

const idSchema = z.string().uuid()
export async function ADMIN_GetOrderUserAction(userId: string) {
    await requireAdmin()
    return prisma.user.findUnique({
        where: { id: idSchema.parse(userId) }, select: {
            id: true, username: true, number: true, storeName: true, credit: true, userStatus: true,
            cart: { include: { cartItems: { include: { product: true }, orderBy: { createdAt: 'desc' } } } },
        }
    })
}

export async function ADMIN_AddItemToCartAction(userId: string, input: CartItemProductItemType) {
    return actionResult(async () => {
        const actor = await requireAdmin()
        userId = idSchema.parse(userId)
        const item = cartInputSchema.parse(input)
        const cartItem = await prisma.$transaction(async tx => {
            const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { userStatus: true } })
            const product = await tx.product.findUnique({ where: { id: item.id }, include: { lens: true } })
            assertOrderEligibility(user.userStatus, product, item)
            const cart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: {} })
            const saved = await tx.cartItem.create({
                data: {
                    cartId: cart.id, productId: item.id, odSph: item.od.sph, odCyl: item.od.cyl, odAux: item.od.aux,
                    osSph: item.os.sph, osCyl: item.os.cyl, osAux: item.os.aux, odOnly: item.odOnly, rawOrCut: item.rawOrCut ? 'CUT' : 'RAW',
                }
            })
            await writeAudit(tx, actor.id, 'ADMIN_CART_ITEM_ADDED', 'User', userId, saved.id)
            return saved
        })
        // The shared builder updates its item list locally; do not refresh during an add.
        return { success: true as const, cartItem, error: undefined }
    });
}

export async function ADMIN_UpdateCartItemRawOrCutAction(userId: string, itemId: string, rawOrCut: boolean) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        userId = idSchema.parse(userId)
        itemId = idSchema.parse(itemId)
        z.boolean().parse(rawOrCut)
        await prisma.$transaction(async tx => {
            await tx.cartItem.update({ where: { id: itemId, cart: { userId } }, data: { rawOrCut: rawOrCut ? 'CUT' : 'RAW' } })
            await writeAudit(tx, actor.id, 'ADMIN_CART_ITEM_UPDATED', 'User', userId, itemId)
        })
        return { success: true }

    });
}

export async function ADMIN_DeleteItemFromCartAction(userId: string, itemId: string) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        userId = idSchema.parse(userId)
        itemId = idSchema.parse(itemId)
        await prisma.$transaction(async tx => {
            await tx.cartItem.delete({ where: { id: itemId, cart: { userId } } })
            await writeAudit(tx, actor.id, 'ADMIN_CART_ITEM_DELETED', 'User', userId, itemId)
        })
        return { success: true }

    });
}

export async function ADMIN_ClearCartAction(userId: string) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        userId = idSchema.parse(userId)
        await prisma.$transaction(async tx => {
            const deleted = await tx.cartItem.deleteMany({ where: { cart: { userId } } })
            await writeAudit(tx, actor.id, 'ADMIN_CART_CLEARED', 'User', userId, `count: ${deleted.count}`)
        })
        return { success: true }

    });
}

export async function ADMIN_SubmitCartOrderAction(userId: string, input: { customerNote: string, deliveryPrice: number }) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        userId = idSchema.parse(userId)
        const { customerNote, deliveryPrice } = z.object({ customerNote: z.string().max(2000), deliveryPrice: z.literal(0) }).parse(input)
        const orderBatch = await prisma.$transaction(async tx => {
            const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { credit: true, userStatus: true } })
            if (user.userStatus !== 'VERIFIED') throw new ExpectedError('حساب کاربر انتخاب‌شده تایید نشده است')
            const cart = await tx.cart.findUnique({ where: { userId }, include: { cartItems: { include: { product: { include: { lens: true, categoryRel: true } } } } } })
            if (!cart?.cartItems.length) throw new ExpectedError('سبد خرید کاربر خالی است')
            if (cart.cartItems.some(item => !item.product.active || item.product.type !== 'LENS')) throw new ExpectedError('سبد خرید دارای محصول غیرقابل سفارش است')
            for (const item of cart.cartItems) assertOrderEligibility(user.userStatus, item.product, storedPrescription(item))
            const items = cart.cartItems.map(item => ({
                productSnapshot: productSnapshot(item.product),
                includesGuarantee: item.product.includesGuarantee,
                guaranteeClientName: item.product.includesGuarantee ? item.guaranteeClientName : "",
                productId: item.productId, purchasedPrice: lensPrice(item.product.price, item.odOnly),
                cutPrice: 0, odSph: item.odSph, odCyl: item.odCyl, odAux: item.odAux,
                osSph: item.osSph, osCyl: item.osCyl, osAux: item.osAux, odOnly: item.odOnly, rawOrCut: item.rawOrCut,
            }))
            const total = items.reduce<number>((sum, item) => sum + item.purchasedPrice, deliveryPrice)
            if (!Number.isSafeInteger(total) || total < 0 || total > 2147483647) throw new ExpectedError('مبلغ سفارش نامعتبر است')
            if (user.credit < total) throw new ExpectedError('اعتبار کاربر انتخاب‌شده کافی نیست')
            await chargeOrderCredit(tx, userId, total)
            const batch = await tx.orderBatch.create({
                data: {
                    userId, deliveryPrice, customerNote, status: 'PENDING', creditCharged: total, orderItems: { create: items },
                }, include: { orderItems: true }
            })
            await tx.cartItem.deleteMany({ where: { cartId: cart.id, id: { in: cart.cartItems.map(item => item.id) } } })
            await writeAudit(tx, actor.id, 'ADMIN_ORDER_SUBMITTED', 'OrderBatch', batch.id, `userId: ${userId}`)
            return batch
        }, { isolationLevel: 'Serializable' })

        revalidatePath('/admin/glasslens-order')
        revalidatePath('/admin/orders')
        revalidatePath(`/admin/users/${userId}`)
        revalidatePath('/glasslens-order')
        revalidatePath('/orders')
        revalidatePath('/', 'layout')
        return { success: true, orderBatch }

    });
}
