"use server"

import { revalidatePath } from "next/cache"
import { ActionError } from "../action-error"
import prisma from "../db"
import { Prisma, ProductType, Tags } from "@/generated/prisma/client"

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
        const data = await prisma.product.create({
            data: {
                name: input.name,
                description: input.description,
                price: input.price,
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
            await prisma.lens.create({
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

        revalidatePath('/admin/products')
        return { data, success: true }
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
        const data = await prisma.product.findMany({
            include: {
                lens: true,
                tags: true
            },
            orderBy:{
                createdAt:"asc"
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

        const result = await prisma.product.update({
            where: { id },
            data,
        });

        return { success: true, data: result };
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
        const data = await prisma.subCategory.update({
            where: { id: id },
            data: {
                name: name,
                description: description
            }
        })

        revalidatePath(`/admin/product-category`)

        return { data, success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get product categorys, check console" })
    }
}

export async function ADMIN_DeleteProduct(id: string,lensId:string | null) {
    try {
        if(lensId){
            await prisma.lens.delete({
                where:{id:lensId}
            })
        }
        
        const data = await prisma.product.delete({
            where:{
                id
            }
        })

        revalidatePath(`/admin/products`)

        return { success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to delete product, check console" })
    }
}