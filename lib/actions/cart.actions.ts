"use server"

import { Prisma } from "@/generated/prisma/client"
import prisma from "@/lib/db"
import { OrderProductItemType } from "@/types/order"
import { ActionError } from "../action-error"

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