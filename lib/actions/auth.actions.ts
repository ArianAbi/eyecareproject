"use server"

import { writeAudit } from "../audit"

import prisma from "@/lib/db"
import { signIn } from "../Auth"
import { AuthError } from "next-auth"
import { LoginSchema, SignupSchema } from "../schemas/auth.schema"
import { hashPassword } from "../password"

export async function CreateUserAction(username: string, number: string, password: string) {

    const validateFields = SignupSchema.safeParse({
        username,
        number,
        password,
        confirmPassword: password
    })

    if (!validateFields.success) {
        return {
            error: "validation failed",
            errors: validateFields.error.flatten()
        }
    }

    try {
        const passwordHash = await hashPassword(validateFields.data.password)
        await prisma.$transaction(async tx => {
        const user = await tx.user.create({
            data: {
                username: validateFields.data.username,
                number: validateFields.data.number,
                password: passwordHash,
            }
        })

            await writeAudit(tx, user.id, "ACCOUNT_CREATED", "User", user.id)
        })

        await signIn('credentials', {
            username: validateFields.data.username,
            password: validateFields.data.password,
            redirect: true,
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

export async function LoginAction(username: string, password: string) {
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
            redirect: true,
            redirectTo: "/"
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
