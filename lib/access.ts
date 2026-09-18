import { auth } from "./Auth"
import prisma from "./db"

export async function requireUser() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("ابتدا وارد حساب کاربری شوید")
    return { ...session.user, id: session.user.id }
}

export async function requireAdmin() {
    const user = await requireUser()
    const account = await prisma.user.findUnique({ where: { id: user.id }, select: { admin: true } })
    if (!account?.admin) throw new Error("شما دسترسی مدیریت ندارید")
    return user
}
