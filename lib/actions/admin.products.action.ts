"use server"

import { requireAdmin } from "../access"
import { priceSchema } from "../schemas/settings"
import { writeAudit } from "../audit"

import { revalidatePath } from "next/cache"
import { ActionError } from "../action-error"
import prisma from "../db"
import { Prisma, ProductType } from "@/generated/prisma/client"

export async function ADMIN_CreateProductsAction(
    input: {
        name: string;
        description: string;
        active: boolean;
        price: number;
        type: ProductType;
        categoryId: string;
        tagIds: string[];
        includesBag: boolean,
        includesSpray: boolean,
        includesCloth: boolean,
        lens: {
            positiveFromSph: string;
            positivToSph: string;
            negativeFromSph: string;
            negativeToSph: string;
            fromCyl: string;
            toCyl: string;
        };
    }
) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

            const data = await tx.product.create({
                data: {
                    name: input.name,
                    description: input.description,
                    price: priceSchema.parse(input.price),
                    type: input.type,
                    categoryId: input.categoryId,
                    ...(input.tagIds !== undefined && {
                        tags: { connect: input.tagIds.map((tagId) => ({ id: tagId })) },
                    }),
                    includesBag: input.includesBag,
                    includesCleaningCloth: input.includesCloth,
                    includesCleaningSpray: input.includesSpray
                }
            })

            if (input.lens && data) {
                await tx.lens.create({
                    data: {
                        positiveFromSph: input.lens.positiveFromSph,
                        positivToSph: input.lens.positivToSph,
                        negativeFromSph: input.lens.negativeFromSph,
                        negativeToSph: input.lens.negativeToSph,
                        fromCyl: input.lens.fromCyl,
                        toCyl: input.lens.toCyl,
                        productId: data.id
                    }
                })
            }

            await writeAudit(tx, actor.id, "ADMIN_CreateProductsAction", "Product", data.id)
            revalidatePath('/admin/products')
            return { data, success: true }

        })
    } catch (err) {
        console.error("ADMIN_CreateProductsAction failed:", err);

        if (err instanceof Error) {
            throw new ActionError({
                error: `Failed to create product: ${err.message}`,
            });
        }

        throw new ActionError({
            error: "Failed to create product: Unknown error",
        });
    }
}

export async function ADMIN_GetProducts() {
    try {
        await requireAdmin()

        const data = await prisma.product.findMany({
            include: {
                lens: true,
                tags: true,
                categoryRel:{
                    select:{
                        id:true,
                        color:true,
                        name:true
                    }
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        })
        return { data, success: true }
    } catch (err) {
        console.error("ADMIN_GetProductsAction failed:", err);

        if (err instanceof Error) {
            throw new ActionError({
                error: `Failed to get product: ${err.message}`,
            });
        }

        throw new ActionError({
            error: "Failed to get product: Unknown error",
        });
    }
}

export async function ADMIN_GetSingleProduct(id: string) {
    try {
        await requireAdmin()

        const data = await prisma.product.findFirst({
            include: {
                lens: true,
                tags: true
            },
            where: {
                id: id,
            }
        })

        return { data, success: true }
    } catch (err) {
        console.error("ADMIN_GetSingleProductsAction failed:", err);

        if (err instanceof Error) {
            throw new ActionError({
                error: `Failed to get single product: ${err.message}`,
            });
        }

        throw new ActionError({
            error: "Failed to get single product: Unknown error",
        });
    }
}

export async function ADMIN_UpdateProduct(
    id: string,
    input: {
        name?: string;
        description?: string;
        active?: boolean;
        price?: number;
        type?: ProductType;
        categoryId?: string;
        tagIds?: string[];
        includesBag: boolean,
        includesSpray: boolean,
        includesCloth: boolean,
        lens?: {
            positiveFromSph: string;
            positivToSph: string;
            negativeFromSph: string;
            negativeToSph: string;
            fromCyl: string;
            toCyl: string;
        } | null;
    }
) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

            const {
                tagIds,
                lens,
                categoryId,
                includesBag,
                includesSpray,
                includesCloth,
                ...scalarFields
            } = input;

            const data: Prisma.ProductUpdateInput = {
                ...scalarFields,
                ...(input.price !== undefined && { price: priceSchema.parse(input.price) }),
                ...(categoryId !== undefined && {
                    categoryRel: { connect: { id: categoryId } },
                }),
                ...(tagIds !== undefined && {
                    tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
                }),
                ...(lens !== undefined && {
                    lens:
                        lens === null
                            ? { delete: true }
                            : { upsert: { create: lens, update: lens } },
                }),
                includesBag,
                includesCleaningSpray: includesSpray,
                includesCleaningCloth: includesCloth,
            };

            const result = await tx.product.update({
                where: { id },
                data,
            });

            await writeAudit(tx, actor.id, "ADMIN_UpdateProduct", "Product", result.id)
            revalidatePath('/admin/products')
            return { success: true, data: result };

        })
    } catch (err) {
        console.error("ADMIN_UpdateProduct failed:", err);

        if (err instanceof Error) {
            throw new ActionError({ error: `Failed to update product: ${err.message}` });
        }

        throw new ActionError({ error: "Failed to update product: Unknown error" });
    }
}

export async function ADMIN_UpdateProductCategorys(id: string, name: string, description: string) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

            const data = await tx.subCategory.update({
                where: { id: id },
                data: {
                    name: name,
                    description: description
                }
            })

            await writeAudit(tx, actor.id, "ADMIN_UpdateProductCategorys", "SubCategory", data.id)
            revalidatePath(`/admin/product-category`)

            return { data, success: true }

        })
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get product categorys, check console" })
    }
}

export async function ADMIN_DeleteProduct(id: string, lensId: string | null) {
    try {
        const actor = await requireAdmin()
        return await prisma.$transaction(async tx => {

            if (lensId) {
                await tx.lens.delete({
                    where: { id: lensId }
                })
            }

            await tx.product.delete({
                where: {
                    id
                }
            })

            await writeAudit(tx, actor.id, "ADMIN_DeleteProduct", "Product", id)
            revalidatePath(`/admin/products`)

            return { success: true }

        })
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to delete product, check console" })
    }
}
