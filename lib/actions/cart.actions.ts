"use server";

import { actionResult, ExpectedError } from "../action-result";
import { productSnapshot } from "../order-snapshot";
import { assertOrderEligibility, cartInputSchema, storedPrescription, lensPrice } from "../lens-policy";
import { calculateOrderCount } from "@/lib/order-count";
import { writeAudit } from "../audit";
import { chargeOrderCredit } from "../order-credit";

import prisma from "@/lib/db";
import { ActionError } from "../action-error";
import { auth } from "../Auth";
import { revalidatePath } from "next/cache";
import { CartItemProductItemType } from "@/types/order";
import { BALE_SendMessage } from "../bale";
import { bale_hashtags } from "../bale-hashtags";
import { emojis } from "../emojis";

export async function GetUserCartItemsAction(userId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) throw new Error("ابتدا وارد حساب شوید");
        userId = session.user.id;
        const data = await prisma.cart.findUnique({
            where: {
                userId,
            },
            include: {
                cartItems: {
                    include: {
                        product: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        return { success: true, data };
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message,
            });
        }

        throw new ActionError({ error: "failed to get user cart" });
    }
}

export async function AddItemToCartAction(orderItem: CartItemProductItemType) {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            success: false as const,
            error: "Please sign in again before adding items to your cart.",
        };
    }
    const userId = session.user.id;
    const parsed = cartInputSchema.safeParse(orderItem);
    if (!parsed.success) return { success: false as const, error: "Invalid prescription." };
    const { od, os, odOnly, rawOrCut, ...product } = parsed.data;

    try {
        const cartItem = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { userStatus: true } });
            const selected = await tx.product.findUnique({ where: { id: product.id }, include: { lens: true } });
            assertOrderEligibility(user.userStatus, selected, parsed.data);
            // find or create the user's cart
            const cart = await tx.cart.upsert({
                where: { userId },
                create: { userId },
                update: {}, // nothing to update, just making sure it exists
            });

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
            });
            await writeAudit(tx, userId, "CART_ITEM_ADDED", "CartItem", item.id);
            return item;
        });

        return { success: true as const, cartItem };
    } catch (err) {
        console.error("Failed to add cart item", err);
        return {
            success: false as const,
            error: "Could not save the cart item. Please try again.",
        };
    }
}

export async function UpdateCartItemRawOrCutAction(
    itemId: string,
    RawOrCut: boolean,
) {
    return actionResult(async () => {

        const session = await auth();
        if (!session?.user?.id) throw new ExpectedError("ابتدا وارد حساب شوید");

        const data = await prisma.$transaction(async (tx) => {
            const item = await tx.cartItem.update({
                where: {
                    id: itemId,
                    cart: { userId: session.user.id },
                },
                data: {
                    rawOrCut: RawOrCut ? "CUT" : "RAW",
                },
            });

            await writeAudit(
                tx,
                session.user.id!,
                "CART_ITEM_UPDATED",
                "CartItem",
                itemId,
            );
            return item;
        });

        return { success: true, data };

    });
}

export async function DeleteItemFromCartAction(
    userId: string,
    cartItemId: string,
) {
    return actionResult(async () => {

        const session = await auth();
        if (!session?.user?.id) throw new ExpectedError("ابتدا وارد حساب شوید");
        userId = session.user.id;
        const deleted = await prisma.$transaction(async (tx) => {
            const item = await tx.cartItem.delete({
                where: {
                    id: cartItemId,
                    cart: { userId }, // ownership check baked into the query itself
                },
            });

            await writeAudit(tx, userId, "CART_ITEM_DELETED", "CartItem", cartItemId);
            return item;
        });

        return { success: true, cartItem: deleted };

    });
}

export async function ClearCartAction() {
    return actionResult(async () => {

        const session = await auth();
        if (!session?.user?.id) throw new ExpectedError("ابتدا وارد حساب شوید");
        const userId = session.user.id;
        await prisma.$transaction(async (tx) => {
            const deleted = await tx.cartItem.deleteMany({ where: { cart: { userId } } });
            await writeAudit(tx, userId, "CART_CLEARED", "User", userId, `count: ${deleted.count}`);
        });
        return { success: true };

    });
}

export async function SubmitCartOrderAction({
    customerNote,
    deliveryPrice,
}: {
    deliveryPrice: number;
    customerNote: string;
}) {
    return actionResult(async () => {

        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "حساب کاربری پیدا نشد" };
        }

        if (
            !Number.isSafeInteger(deliveryPrice) ||
            deliveryPrice !== 0 ||
            deliveryPrice > 2147483647
        ) {
            throw new ExpectedError("اطلاعات سفارش نامعتبر است");
        }

        if (typeof customerNote !== "string" || customerNote.length > 2000) {
            throw new ExpectedError("توضیحات بیشتر از 2000 حرف است");
        }

        const userId = session.user.id;

        const orderBatch = await prisma.$transaction(
            async (tx) => {
                const cart = await tx.cart.findUnique({
                    where: { userId },
                    include: { cartItems: { include: { product: { include: { lens: true, categoryRel: true } } } } },
                });

                if (!cart || cart.cartItems.length === 0) {
                    throw new ExpectedError("سبد خرید یافت نشد یا خالی است");
                }

                const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { userStatus: true } });
                for (const item of cart.cartItems) assertOrderEligibility(user.userStatus, item.product, storedPrescription(item));
                const orderSumPrice = cart.cartItems.reduce(
                    (sum, item) =>
                        sum +
                        (lensPrice(item.product.price, item.odOnly)),
                    deliveryPrice,
                );
                await chargeOrderCredit(tx, userId, orderSumPrice);

                const batch = await tx.orderBatch.create({
                    data: {
                        userId,
                        deliveryPrice,
                        customerNote,
                        status: "PENDING",
                        creditCharged: orderSumPrice,
                        orderItems: {
                            create: cart.cartItems.map((item) => ({
                                productId: item.productId,
                                productSnapshot: productSnapshot(item.product),
                                includesGuarantee: item.product.includesGuarantee,
                                guaranteeClientName: item.product.includesGuarantee ? item.guaranteeClientName : "",
                                purchasedPrice: lensPrice(item.product.price, item.odOnly),
                                cutPrice: 0, // Cutting fees disabled; delivery uses the daily-fee workflow.
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
                });

                await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

                await writeAudit(tx, userId, "ORDER_SUBMITTED", "OrderBatch", batch.id);

                return batch;
            },
            { isolationLevel: "Serializable" },
        );

        // Notify only after commit; notification failures must not undo a saved order.
        try {
            await BALE_SendMessage(`${emojis.glass} سفارش جدید
                کاربر : ${session.user.username}
                کد سفارش : ${orderBatch.orederIdentification}
                تعداد آیتمای سفارش : ${calculateOrderCount(orderBatch.orderItems)}
                مبلغ سفارش : ${orderBatch.creditCharged.toLocaleString()}

                ${bale_hashtags.order_submited}
                `);
        } catch (error) {
            console.error("Bale order notification failed", error);
        }


        revalidatePath("/", "layout");
        return { success: true, orderBatch };

    });
}
