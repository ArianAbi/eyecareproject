"use server"

import { InvoiceWhereInput } from "@/generated/prisma/models"
import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"
import { PaginationObjectDB } from "../pagination-object"

// TODO: replace this check with whatever your existing ADMIN_ actions use
// (e.g. see ADMIN_UpdateMasterCategorys) — this assumes a `session.user.admin`
// boolean that isn't currently in your NextAuth session type.
async function requireAdmin() {
    // const session = await auth()
    // if (!session || !session.user.admin) {
    //     throw new Error("شما دسترسی ادمین ندارید")
    // }
    // return session
    const session = await auth()
    if (!session) {
        throw new Error("شما دسترسی ادمین ندارید")
    }
    return session
}

export async function ADMIN_GetInvoicesAction(filters: {
    page?: number
    status?: "PENDING" | "PAID" | "CANCELED"
}) {
    try {
        await requireAdmin()

        // const where:InvoiceWhereInput = filters.status ? { : filters.status } : {}

        const data = await prisma.$transaction(async tnx => {
            const invoices = await tnx.invoice.findMany({
                include: {
                    user: { select: { id: true, username: true } }
                },
                orderBy: { createdAt: "desc" },
                ...(PaginationObjectDB(filters.page))
            })
            const total = await tnx.invoice.count()
            return { invoices, total }
        })

        return { success: true, data }
    } catch (err) {
        if (err instanceof Error) throw new ActionError({ error: err.message })
        throw new ActionError({ error: "admin get invoices:unknown error" })
    }
}

// Approves a PENDING invoice (CASH or CREDIT) and credits the user's balance.
// Guarded so it can only ever fire once per invoice, even under concurrent calls.
export async function ADMIN_ApproveInvoiceAction(invoiceId: string) {
    try {
        await requireAdmin()

        const invoice = await prisma.$transaction(async tnx => {
            const updated = await tnx.invoice.updateMany({
                where: { id: invoiceId, status: "PENDING" },
                data: { status: "PAID" }
            })

            if (updated.count === 0) {
                throw new Error("این فاکتور قبلا بررسی شده یا یافت نشد")
            }

            const invoice = await tnx.invoice.findUniqueOrThrow({ where: { id: invoiceId } })

            await tnx.user.update({
                where: { id: invoice.userId },
                data: { credit: { increment: invoice.amount } }
            })

            return invoice
        })

        return { success: true, data: invoice }
    } catch (err) {
        if (err instanceof Error) throw new ActionError({ error: err.message })
        throw new ActionError({ error: "admin approve invoice:unknown error" })
    }
}

export async function ADMIN_RejectInvoiceAction(invoiceId: string) {
    try {
        await requireAdmin()

        const updated = await prisma.invoice.updateMany({
            where: { id: invoiceId, status: "PENDING" },
            data: { status: "CANCELED" }
        })

        if (updated.count === 0) {
            throw new Error("این فاکتور قبلا بررسی شده یا یافت نشد")
        }

        return { success: true }
    } catch (err) {
        if (err instanceof Error) throw new ActionError({ error: err.message })
        throw new ActionError({ error: "admin reject invoice:unknown error" })
    }
}
