"use server"

import { auth } from "../Auth"
import prisma from "../db"

// Deliberately standalone, as requested in todos.txt.
export async function isAdmin() {
    const session = await auth()
    if (!session?.user?.id) return false
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } })
    return user?.admin === true
}
