"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import prisma from "../db"
import { requireAdmin } from "../access"
import { writeAudit } from "../audit"
import { orderEvents } from "../order-event"
import type { CartItemProductItemType } from "@/types/order"

const idSchema = z.string().uuid()
const eyeSchema = z.object({
    sph: z.string().max(12).refine(value => value.trim() !== '' && Number.isFinite(Number(value))),
    cyl: z.string().max(12).refine(value => value.trim() !== '' && Number.isFinite(Number(value))),
    aux: z.string().max(3).refine(value => /^\d+$/.test(value) && Number(value) <= 180),
})

export async function ADMIN_GetOrderUserAction(userId: string) {
    await requireAdmin()
    return prisma.user.findUnique({ where: { id: idSchema.parse(userId) }, select: {
        id: true, username: true, number: true, storeName: true, credit: true, userStatus: true,
        cart: { include: { cartItems: { include: { product: true }, orderBy: { createdAt: 'desc' } } } },
    } })
}

export async function ADMIN_AddItemToCartAction(userId: string, input: CartItemProductItemType) {
    const actor = await requireAdmin()
    userId = idSchema.parse(userId)
    const item = z.object({ id: idSchema, od: eyeSchema, os: eyeSchema, odOnly: z.boolean(), rawOrCut: z.boolean() }).parse(input)
    const cartItem = await prisma.$transaction(async tx => {
        await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true } })
        const product = await tx.product.findUnique({ where: { id: item.id }, select: { active: true, type: true } })
        if (!product?.active || product.type !== 'LENS') throw new Error('محصول انتخاب‌شده قابل سفارش نیست')
        const cart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: {} })
        const saved = await tx.cartItem.create({ data: {
            cartId: cart.id, productId: item.id, odSph: item.od.sph, odCyl: item.od.cyl, odAux: item.od.aux,
            osSph: item.os.sph, osCyl: item.os.cyl, osAux: item.os.aux, odOnly: item.odOnly, rawOrCut: item.rawOrCut ? 'CUT' : 'RAW',
        } })
        await writeAudit(tx, actor.id, 'ADMIN_CART_ITEM_ADDED', 'User', userId, saved.id)
        return saved
    })
    // The shared builder updates its item list locally; do not refresh during an add.
    return { success: true as const, cartItem, error: undefined }
}

export async function ADMIN_UpdateCartItemRawOrCutAction(userId: string, itemId: string, rawOrCut: boolean) {
    const actor = await requireAdmin()
    userId = idSchema.parse(userId)
    itemId = idSchema.parse(itemId)
    z.boolean().parse(rawOrCut)
    await prisma.$transaction(async tx => {
        await tx.cartItem.update({ where: { id: itemId, cart: { userId } }, data: { rawOrCut: rawOrCut ? 'CUT' : 'RAW' } })
        await writeAudit(tx, actor.id, 'ADMIN_CART_ITEM_UPDATED', 'User', userId, itemId)
    })
    return { success: true }
}

export async function ADMIN_DeleteItemFromCartAction(userId: string, itemId: string) {
    const actor = await requireAdmin()
    userId = idSchema.parse(userId)
    itemId = idSchema.parse(itemId)
    await prisma.$transaction(async tx => {
        await tx.cartItem.delete({ where: { id: itemId, cart: { userId } } })
        await writeAudit(tx, actor.id, 'ADMIN_CART_ITEM_DELETED', 'User', userId, itemId)
    })
    return { success: true }
}

export async function ADMIN_SubmitCartOrderAction(userId: string, input: { customerNote: string, deliveryPrice: number }) {
    const actor = await requireAdmin()
    userId = idSchema.parse(userId)
    const { customerNote, deliveryPrice } = z.object({ customerNote: z.string().max(2000), deliveryPrice: z.number().int().min(0).max(2147483647) }).parse(input)
    const orderBatch = await prisma.$transaction(async tx => {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { credit: true, userStatus: true } })
        if (user.userStatus !== 'VERIFIED') throw new Error('حساب کاربر انتخاب‌شده تایید نشده است')
        const cart = await tx.cart.findUnique({ where: { userId }, include: { cartItems: { include: { product: true } } } })
        if (!cart?.cartItems.length) throw new Error('سبد خرید کاربر خالی است')
        if (cart.cartItems.some(item => !item.product.active || item.product.type !== 'LENS')) throw new Error('سبد خرید دارای محصول غیرقابل سفارش است')
        const items = cart.cartItems.map(item => ({
            productId: item.productId, purchasedPrice: item.odOnly ? Math.round(item.product.price / 2) : item.product.price,
            cutPrice: 0, odSph: item.odSph, odCyl: item.odCyl, odAux: item.odAux,
            osSph: item.osSph, osCyl: item.osCyl, osAux: item.osAux, odOnly: item.odOnly, rawOrCut: item.rawOrCut,
        }))
        const total = items.reduce((sum, item) => sum + item.purchasedPrice, deliveryPrice)
        if (!Number.isSafeInteger(total) || total < 0 || total > 2147483647) throw new Error('مبلغ سفارش نامعتبر است')
        if (user.credit < total) throw new Error('اعتبار کاربر انتخاب‌شده کافی نیست')
        const batch = await tx.orderBatch.create({ data: {
            userId, deliveryPrice, customerNote, status: 'PENDING', orderItems: { create: items },
        }, include: { orderItems: true } })
        await tx.cartItem.deleteMany({ where: { cartId: cart.id, id: { in: cart.cartItems.map(item => item.id) } } })
        await writeAudit(tx, actor.id, 'ADMIN_ORDER_SUBMITTED', 'OrderBatch', batch.id, `userId: ${userId}`)
        return batch
    }, { isolationLevel: 'Serializable' })
    try {
        const count = await prisma.orderBatch.count({ where: { status: 'PENDING' } })
        orderEvents.emit('newOrder', count)
    } catch (error) { console.error('Order notification failed', error) }
    revalidatePath('/admin/glasslens-order')
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/glasslens-order')
    revalidatePath('/orders')
    return { success: true, orderBatch }
}
