"use server"

import { writeAudit } from "../audit"
import { orderEvents } from "../order-event"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/db"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import { revalidatePath } from "next/cache"
import { CartItemProductItemType } from "@/types/order"

export async function GetUserCartItemsAction(userId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("ابتدا وارد حساب شوید")
        userId = session.user.id
        const data = await prisma.cart.findUnique({
            where: {
                userId,
            },
            include: {
                cartItems: {
                    include: {
                        product: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        return { success: true, data }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }

        throw new ActionError({ error: "failed to get user cart" })
    }
}

export async function AddItemToCartAction(orderItem: CartItemProductItemType) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false as const, error: "Please sign in again before adding items to your cart." }
    }
    const userId = session.user.id
    const { od, os, odOnly, rawOrCut, ...product } = orderItem

    try {
        const cartItem = await prisma.$transaction(async (tx) => {
            // find or create the user's cart
            const cart = await tx.cart.upsert({
                where: { userId },
                create: { userId },
                update: {}, // nothing to update, just making sure it exists
            })

            // create the cart item tied to it
            const item = await tx.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: product.id,
                    odSph: od.sph,
                    odCyl: od.cyl,
                    osSph: os.sph,
                    osCyl: os.cyl,
                    odOnly,
                    odAux: od.aux,
                    osAux: os.aux,
                    rawOrCut: rawOrCut ? "CUT" : "RAW",
                },
            })
            await writeAudit(tx, userId, "CART_ITEM_ADDED", "CartItem", item.id)
            return item
        })

        return { success: true as const, cartItem }
    } catch (err) {
        console.error("Failed to add cart item", err)
        return { success: false as const, error: "Could not save the cart item. Please try again." }
    }
}

export async function UpdateCartItemRawOrCutAction(itemId: string, RawOrCut: boolean) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("ابتدا وارد حساب شوید")

        const data = await prisma.$transaction(async tx => {
            const item = await tx.cartItem.update({
                where: {
                    id: itemId,
                    cart: { userId: session.user.id }
                },
                data: {
                    rawOrCut: RawOrCut ? 'CUT' : 'RAW'
                }
            })

            await writeAudit(tx, session.user.id!, "CART_ITEM_UPDATED", "CartItem", itemId)
            return item
        })

        return { success: true, data }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "unknown error"
        })
    }
}

export async function DeleteItemFromCartAction(userId: string, cartItemId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) throw new Error("ابتدا وارد حساب شوید")
        userId = session.user.id
        const deleted = await prisma.$transaction(async tx => {
            const item = await tx.cartItem.delete({
                where: {
                    id: cartItemId,
                    cart: { userId }, // ownership check baked into the query itself
                },
            })

            await writeAudit(tx, userId, "CART_ITEM_DELETED", "CartItem", cartItemId)
            return item
        })

        return { success: true, cartItem: deleted }
    } catch (err) {
        // Prisma throws P2025 when the where clause matches no rows —
        // either the item doesn't exist, or it doesn't belong to this user
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
            throw new ActionError({
                error: "Item not found or you don't have permission to remove it"
            })
        }

        throw new ActionError({
            error: "Unknown Error"
        })
    }
}

export async function SubmitCartOrderAction({ customerNote, deliveryPrice }: {
    deliveryPrice: number,
    customerNote: string
}) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: "حساب کاربری پیدا نشد" }
    }

    if (!Number.isSafeInteger(deliveryPrice) || deliveryPrice < 0 || deliveryPrice > 2147483647) {
        throw new Error("اطلاعات سفارش نامعتبر است")
    }

    if (customerNote.length > 2000) {
        throw new Error("توضیحات بیشتر از 2000 حرف است")
    }

    const userId = session.user.id
    const userCredit = session.user.credit

    try {
        const orderBatch = await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: { cartItems: { include: { product: true } } },
            })

            if (!cart || cart.cartItems.length === 0) {
                throw new Error("سبد خرید یافت نشد یا خالی است")
            }

            const orderSumPrice = cart.cartItems.reduce((acc, curr) => {
                const price = curr.odOnly ? curr.product.price / 2 : curr.product.price

                return acc += price
            }, 0)

            if (!userCredit || userCredit < orderSumPrice) {
                throw new Error("موجودی شما کافی نیست")
            }


            const batch = await tx.orderBatch.create({
                data: {
                    userId,
                    deliveryPrice,
                    customerNote,
                    status: "PENDING",
                    orderItems: {
                        create: cart.cartItems.map(item => ({
                            productId: item.productId,
                            purchasedPrice: item.odOnly
                                ? Math.round(item.product.price / 2)
                                : item.product.price,
                            cutPrice: 0, // TODO: pull from Settings model once it exists
                            odSph: item.odSph,
                            odCyl: item.odCyl,
                            osSph: item.osSph,
                            osCyl: item.osCyl,
                            odOnly: item.odOnly,
                            odAux: item.odAux,
                            osAux: item.osAux,
                            rawOrCut: item.rawOrCut,
                        })),
                    },
                },
                include: { orderItems: true },
            })

            await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

            await writeAudit(tx, userId, "ORDER_SUBMITTED", "OrderBatch", batch.id)

            return batch
        }, { isolationLevel: 'Serializable' })

        // Notify only after commit; notification failures must not undo a saved order.
        try {
            const count = await prisma.orderBatch.count({ where: { status: 'PENDING' } })
            orderEvents.emit('newOrder', count)
        } catch (error) { console.error('Order notification failed', error) }

        revalidatePath(`/glasslens-order`)
        return { success: true, orderBatch }
    } catch (err) {
        if (err instanceof Error && err.message === "EMPTY_CART") {
            throw new ActionError({
                error: "Empty Cart"
            })
        }

        console.error(err)
        throw new ActionError({
            error: err instanceof Error ? err.message : "unknown error"
        })
    }
}
