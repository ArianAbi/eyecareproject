"use server"

import { revalidatePath } from "next/cache"
import { ActionError } from "../action-error"
import prisma from "../db"
import { ProductType } from "@/generated/prisma/client"

export async function ADMIN_CreateProductAction(data: {
    name: string,
    description: string,
    price: string,
    type: ProductType,
    categoryId: string,
    lens?: {
        fromOd: string,
        fromOs: string,
        toOd?: string,
        toOs?: string
    }
},) {
    try {
        if (!data.name) throw new ActionError({ error: "نام دسته بندی الزامیست" })
        if (!data.description) throw new ActionError({ error: "توضیحات الزامیست" })
        if (!data.categoryId) throw new ActionError({ error: "زیرمجموعه باید انتخاب شود" })
        if (!data.price) throw new ActionError({ error: "قیمت باید تعیین شود" })
        if (!data.type) throw new ActionError({ error: "نوع باید مشخص شود" })

        if (data.type == 'LENS') {
            if (!data.lens) throw new ActionError({ error: "برای محصول با نوع عدسی مشخصات عدسی الزامیست" })
        }

        const result = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                categoryId: data.categoryId,
                type: data.type,
                price: data.price,
                ...(
                    data.lens && {
                        lens: {
                            create: {
                                fromOd: data.lens.fromOd,
                                fromOs: data.lens.fromOs,
                                toOs: data.lens.toOd ? data.lens.toOd : "",
                                toOd: data.lens.toOs ? data.lens.toOs : "",
                            }
                        }
                    }
                )
            }
        })

        revalidatePath(`/admin/products`)

        return { success: true, data: result }
    } catch (err) {
        console.log(err);
        throw new ActionError({ error: "failed to create product, check console" })
    }
}

export async function ADMIN_GetProducts() {
    try {
        const data = await prisma.product.findMany({
            include: {
                lens:true
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