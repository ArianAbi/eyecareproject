"use server"

import prisma from "@/lib/db"

export async function CreateUserr({ username, number, password }: { username: string, number: string, password: string }) {
    const result = await prisma.user.create({
        data: {
            username,
            number,
            password
        }
    })

    return result
}