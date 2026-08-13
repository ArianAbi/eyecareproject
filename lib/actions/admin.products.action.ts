"use server"

import { revalidatePath } from "next/cache"
import { ActionError } from "../action-error"
import prisma from "../db"
import { ProductType } from "@/generated/prisma/client"

export async function ADMIN_CreateProductsAction(
    name: string,
    description: string,
    categoryId: string,
    price: string,
    type: ProductType,
    lensRange?: {
        from: string,
        to: string
    }
) {
    try {
        const data = await prisma.product.create({
            data: {
                name,
                description,
                price,
                type,
                categoryId
            }
        })

        if (lensRange !== undefined && data) {
            await prisma.lens.create({
                data: {
                    fromOd: lensRange.from,
                    fromOs: lensRange.from,
                    toOd: lensRange.to,
                    toOs: lensRange.to,
                    productId: data.id
                }
            })
        }

        return { data, success: true }
    } catch (err) {
        throw new ActionError({ error: "failed to create master category, check console" })
    }
}

export async function ADMIN_GetProducts() {
    try {
        const data = await prisma.product.findMany({
            include: {
                lens: true
            }
        })
        return { data, success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to get products, check console" })
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

export async function ADMIN_DeleteProductCategorys(id: string) {
    try {
        const data = await prisma.subCategory.findFirst({
            include: {
                products: true
            },
            where: {
                id: id
            }
        })

        if (!data) throw new ActionError({ error: "failed to fetch this category data" })
        if (data.products.length > 0) throw new ActionError({ error: "این دسته بندی محصول دارد و قابل حذف نیست" })

        await prisma.subCategory.delete({
            where: { id }
        })

        revalidatePath(`/admin/product-category`)

        return { success: true }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to delete master categorys, check console" })
    }
}