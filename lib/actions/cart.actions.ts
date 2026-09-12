"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/db"
import { OrderProductItemType } from "@/types/order"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import { revalidatePath } from "next/cache"

export async function GetUserCartItemsAction(userId: string) {
    try {
        const data = await prisma.cart.findUnique({
            where: {
                userId
            },
            include: {
                cartItems: {
                    include: {
                        product: true
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

export async function AddItemToCartAction(userId: string, orderItem: OrderProductItemType) {
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
            return tx.cartItem.create({
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
        })

        return { success: true, cartItem }
    } catch (err) {
        console.error(err)
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
    }
}

export async function DeleteItemFromCartAction(userId: string, cartItemId: string) {
    try {
        const deleted = await prisma.cartItem.delete({
            where: {
                id: cartItemId,
                cart: { userId }, // ownership check baked into the query itself
            },
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

export async function SubmitCartOrderAction(deliveryPrice: number = 0) {
    const session = await auth()

    if (!session?.user?.id) {
        return { success: false, error: "حساب کاربری پیدا نشد" }
    }

    const userId = session.user.id

    try {
        const orderBatch = await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: { cartItems: { include: { product: true } } },
            })

            if (!cart || cart.cartItems.length === 0) {
                throw new Error("EMPTY_CART")
            }

            const batch = await tx.orderBatch.create({
                data: {
                    userId,
                    deliveryPrice,
                    orderItems: {
                        create: cart.cartItems.map(item => ({
                            productId: item.productId,
                            purchasedPrice: item.odOnly
                                ? Math.round(item.product.price / 2)
                                : item.product.price,
                            cutPrice: 0, // TODO: pull from Settings model once it exists
                            status: "SUBMITIED",
                            odSph: item.odSph,
                            odCyl: item.odCyl,
                            osSph: item.osSph,
                            osCyl: item.osCyl,
                            odOnly: item.odOnly,
                            odAux: item.odAux,
                            osAux: item.osAux,
                            customerNote: item.customerNote,
                            rawOrCut: item.rawOrCut,
                        })),
                    },
                },
                include: { orderItems: true },
            })

            await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

            return batch
        })

        revalidatePath(`/glasslens-order`)
        return { success: true, orderBatch }
    } catch (err) {
        if (err instanceof Error && err.message === "EMPTY_CART") {
            return { success: false, error: "سبد خرید شما خالی است" }
        }

        console.error(err)
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
    }
}