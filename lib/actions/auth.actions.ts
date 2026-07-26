"use server"

import prisma from "@/lib/db"
import { signIn } from "../Auth"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"
import z from "zod"

export async function CreateUserAction({ username, number, password }: { username: string, number: string, password: string }) {
    const result = await prisma.user.create({
        data:{
            username,
            number,
            password
        }
    })

    return result
}

export const LoginSchema = z.object({
    username:z.string().min(4,{error:"نام کاربری باید حداقل 4 حرف باشد"}).max(15,{error:"نام کاربری نمیتواند بیشتر از 15 حرف باشد"}),
    password:z.string().min(8,{error:"کلمه عبور باید حداقل 8 حرف باشد"}).max(30,{error:"کلمه عبور نمیتواند بیشتر از 30 حرف باشد"})
})

export type LoginSchemaType = z.infer<typeof LoginSchema>

export async function LoginAction(prevState:any,data: FormData) {
    const username = data.get('username')
    const password = data.get('password')

    const validateFields = LoginSchema.safeParse({
        username,
        password
    })

    if(!validateFields.success){
        return {
            errors:validateFields.error.flatten()
        }
    }

    try {
        await signIn('credentials', {
            username: username,
            password: password,
            redirectTo: '/',
        })

        return {}
    } catch (err) {
        if (err instanceof AuthError) {
            return {
                error:"اطلاعات وارد شده صحیح نمیباشد"
            }
        }
        throw err
    }
}