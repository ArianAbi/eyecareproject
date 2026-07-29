"use server"

import prisma from "@/lib/db"
import { signIn } from "../Auth"
import { AuthError } from "next-auth"
import { LoginSchema, SignupSchema } from "../schemas/auth.schema"

export async function CreateUserAction(prevState: any, data: FormData) {
    const username = data.get('username')
    const number = data.get('number')
    const password = data.get('password')

    const validateFields = SignupSchema.safeParse({
        username,
        number,
        password
    })

    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten()
        }
    }

    try {
        const result = await prisma.user.create({
            data: {
                username: validateFields.data.username,
                number: validateFields.data.number,
                password: validateFields.data.password,
            }
        })

        await signIn('credentials', {
            username: validateFields.data.username,
            password: validateFields.data.password,
            redirect:true,
            redirectTo: '/',
        })

        return {}
    } catch (err) {
        if (err instanceof AuthError) {
            return {
                error: "اطلاعات وارد شده صحیح نمیباشد"
            }
        }
        throw err
    }
}

export async function LoginAction(prevState: any, data: FormData) {
    const username = data.get('username')
    const password = data.get('password')

    const validateFields = LoginSchema.safeParse({
        username,
        password
    })

    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten()
        }
    }

    try {
        await signIn('credentials', {
            username: username,
            password: password,
            redirect:true,
            redirectTo:"/"
        })
    } catch (err) {
        if (err instanceof AuthError) {
            return {
                error: "اطلاعات وارد شده صحیح نمیباشد"
            }
        }
        throw err
    }
}