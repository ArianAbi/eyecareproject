"use server"

// import { revalidatePath } from "next/cache"
// import { ActionError } from "../action-error"
// import prisma from "../db"

// export async function ADMIN_CreateProductCategoryAction(data: FormData) {
//     try {
//         const name = data.get("name")

//         if (!name) throw new ActionError({ error: "نام دسته بندی الزامیست" })

//         const result = await prisma.subCategory.create({
//             data: {
                
//             }
//         })
 
//         revalidatePath(`/admin/mater-category`)
        
//         return { success: true, data: result }
//     } catch (err) {
//         console.log(err);
//         throw new ActionError({ error: "failed to create master category, check console" })
//     }
// }

// export async function ADMIN_GetMasterCategorys() {
//     try {
//         const data = await prisma.masterCategory.findMany()
//         return { data, success: true }
//     } catch (err) {
//         console.log(err);
//         throw new ActionError({ error: "failed to get master categorys, check console" })
//     }
// }

// export async function ADMIN_UpdateMasterCategorys(id: string, name: string, active: boolean) {
//     try {
//         const data = await prisma.masterCategory.update({
//             where: { id: id },
//             data: {
//                 name:name,
//                 active:active
//             }
//         })

//         revalidatePath(`/admin/mater-category`)

//         return { data, success: true }
//     } catch (err) {
//         console.log(err);
//         throw new ActionError({ error: "failed to get master categorys, check console" })
//     }
// }

// export async function ADMIN_DeleteMasterCategorys(id: string) {
//     try {
//         await prisma.masterCategory.delete({
//             where: { id }
//         })

//         revalidatePath(`/admin/mater-category`)

//         return { success: true }
//     } catch (err) {
//         console.log(err);
//         throw new ActionError({ error: "failed to delete master categorys, check console" })
//     }
// }