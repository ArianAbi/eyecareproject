// import { ProductType } from "@/generated/prisma/enums";
// import { ActionError } from "../action-error";
// import prisma from "../db";

// export async function ADMIN_GetProductsAction() {
//     try {
//         const data = await prisma.product.findMany()

//         return { data, success: true }
//     } catch (err) {
//         throw new ActionError({ error: "failed to create master category, check console" })
//     }
// }

// export async function ADMIN_CreateProductsAction(
//     name: string,
//     description: string,
//     categoryId: string,
//     price: string,
//     type: ProductType,
//     lensRange?: {
//         from: string,
//         to: string
//     }
// ) {
//     try {
//         const data = await prisma.product.create({
//             data: {
//                 name,
//                 description,
//                 price,
//                 type,
//                 categoryId
//             }
//         })

//         if (lensRange !== undefined && data) {
//             prisma.lens.create({
//                 data: {
//                     fromOd: lensRange.from,
//                     fromOs: lensRange.from,
//                     toOd: lensRange.to,
//                     toOs: lensRange.to,
//                     productId: data.id
//                 }
//             })
//         }

//         return { data, success: true }
//     } catch (err) {
//         throw new ActionError({ error: "failed to create master category, check console" })
//     }
// }