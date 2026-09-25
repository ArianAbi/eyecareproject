"use server"

import { actionResult, ExpectedError } from "../action-result";
import { productSchema } from "../schemas/product"
import { PaginationObjectDB } from "../pagination-object"
import { z } from "zod"

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
        includesGuarantee: boolean,
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
    return actionResult(async () => {

        const actor = await requireAdmin()
        input = productSchema.parse(input) as typeof input
        const committed = await prisma.$transaction(async tx => {

            const category = await tx.subCategory.findUniqueOrThrow({ where: { id: input.categoryId }, include: { masterCategory: true } })
            if (category.masterCategory.type !== input.type || (input.type === 'LENS' && !input.lens)) throw new ExpectedError('Invalid product category or lens')
            const data = await tx.product.create({
                data: {
                    active: input.active,
                    name: input.name,
                    description: input.description,
                    price: priceSchema.parse(input.price),
                    type: input.type,
                    categoryId: input.categoryId,
                    ...(input.tagIds !== undefined && {
                        tags: { connect: input.tagIds.map((tagId) => ({ id: tagId })) },
                    }),
                    includesGuarantee: z.boolean().parse(input.includesGuarantee),
                    includesBag: input.includesBag,
                    includesCleaningCloth: input.includesCloth,
                    includesCleaningSpray: input.includesSpray
                }
            })

            if (input.type === 'LENS' && input.lens && data) {
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

            return { data, success: true }

        })
        revalidatePath('/admin/products')
        revalidatePath("/admin/products/create");
        revalidatePath("/admin/product-category");
        revalidatePath("/glasslens-order");
        revalidatePath("/admin/glasslens-order");
        return committed;

    });
}

export async function ADMIN_GetProducts(page?: string) {
    try {
        await requireAdmin()

        const data = await prisma.product.findMany({
            ...PaginationObjectDB(page),
            include: {
                lens: true,
                tags: true,
                categoryRel: {
                    select: {
                        id: true,
                        color: true,
                        name: true
                    }
                }
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }]
        })
        return { data, total: await prisma.product.count(), success: true }
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
        includesGuarantee: boolean,
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
    return actionResult(async () => {

        const actor = await requireAdmin()
        z.string().uuid().parse(id)
        input = productSchema.partial().parse(input) as typeof input
        const committed = await prisma.$transaction(async tx => {
            const previous = await tx.product.findUniqueOrThrow({ where: { id }, include: { lens: true } })
            const type = input.type ?? previous.type
            const category = await tx.subCategory.findUniqueOrThrow({ where: { id: input.categoryId ?? previous.categoryId }, include: { masterCategory: true } })
            if (category.masterCategory.type !== type || (type === 'LENS' && !(input.lens === undefined ? previous.lens : input.lens))) throw new ExpectedError('Invalid product category or lens')
            if (type !== 'LENS') input.lens = previous.lens ? null : undefined

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
                includesGuarantee: z.boolean().parse(input.includesGuarantee),
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

            return { success: true, data: result };

        })
        revalidatePath('/admin/products')
        revalidatePath("/admin/products/create");
        revalidatePath("/admin/product-category");
        revalidatePath("/glasslens-order");
        revalidatePath("/admin/glasslens-order");
        return committed;

    });
}

export async function ADMIN_UpdateProductCategorys(id: string, name: string, description: string) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        const committed = await prisma.$transaction(async tx => {

            const data = await tx.subCategory.update({
                where: { id: id },
                data: {
                    name: name,
                    description: description
                }
            })

            await writeAudit(tx, actor.id, "ADMIN_UpdateProductCategorys", "SubCategory", data.id)

            return { data, success: true }

        })
        revalidatePath(`/admin/product-category`)
        revalidatePath("/admin/products/create");
        revalidatePath("/admin/product-category");
        revalidatePath("/glasslens-order");
        revalidatePath("/admin/glasslens-order");
        return committed;

    });
}

export async function ADMIN_DeleteProduct(id: string, _lensId: string | null) {
    return actionResult(async () => {

        void _lensId; // Compatibility only; the relation is always read from the database.
        const actor = await requireAdmin()
        const committed = await prisma.$transaction(async tx => {

            z.string().uuid().parse(id)
            const product = await tx.product.findUniqueOrThrow({ where: { id }, include: { lens: true, _count: { select: { orderItem: true, cartItems: true } } } })
            if (product._count.orderItem || product._count.cartItems) {
                await tx.product.update({ where: { id }, data: { active: false } })
            } else {
                if (product.lens) await tx.lens.delete({ where: { productId: id } })
                await tx.product.delete({ where: { id } })
            }

            await writeAudit(tx, actor.id, "ADMIN_DeleteProduct", "Product", id)

            return { success: true }

        })
        revalidatePath(`/admin/products`)
        revalidatePath("/admin/products/create");
        revalidatePath("/admin/product-category");
        revalidatePath("/glasslens-order");
        revalidatePath("/admin/glasslens-order");
        return committed;

    });
}
