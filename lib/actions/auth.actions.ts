"use server"

import prisma from "@/lib/db"
import { signIn } from "../Auth"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

export async function CreateUserAction({ username, number, password }: { username: string, number: string, password: string }) {
    const result = await prisma.user.create({
        data: {
            username,
            number,
            password
        }
    })

    return result
}

export async function LoginAction(data: FormData) {
    const name = data.get('username')
    const password = data.get('password')

    try {
        await signIn('credentials', {
            username: name,
            password: password,
            redirectTo: '/',
        })
    } catch (err) {
        if (err instanceof AuthError) {
            redirect('/login?error=invalid')
        }
        throw err
    }
}