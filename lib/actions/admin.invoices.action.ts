"use server"

import { actionResult, ExpectedError } from "../action-result";
import prisma from "../db"
import { requireAdmin } from "../access"
import { writeAudit } from "../audit"
import { PaginationObjectDB } from "../pagination-object"
import { revalidatePath } from "next/cache"
import { invoiceWhere, type InvoiceFilters } from "../invoice-filters"

export async function ADMIN_GetInvoicesAction(filters: InvoiceFilters = {}) {
    await requireAdmin()
    const where = invoiceWhere(filters)
    const data = await prisma.$transaction(async tx => ({
        invoices: await tx.invoice.findMany({
            where, include: { user: { select: { id: true, username: true } } },
            orderBy: { createdAt: 'desc' }, ...PaginationObjectDB(filters.page)
        }),
        total: await tx.invoice.count({ where }),
    }))
    return { success: true, data }
}

export async function ADMIN_GetSingleInvoiceAction(id: string) {
    await requireAdmin()
    return prisma.invoice.findUnique({ where: { id }, include: { user: { select: { username: true } } } })
}

export async function ADMIN_ApproveInvoiceAction(invoiceId: string) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        const invoice = await prisma.$transaction(async tx => {
            const updated = await tx.invoice.updateMany({
                where: { id: invoiceId, status: 'WAITING_FOR_APPORVAL', paymentType: 'CREDIT' },
                data: { status: 'PAID', paidAt: new Date(), creditAppliedAt: new Date() },
            })
            if (!updated.count) throw new ExpectedError("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
            const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
            const credited = await tx.user.updateMany({ where: { id: invoice.userId, credit: { lte: 2147483647 - invoice.amount } }, data: { credit: { increment: invoice.amount } } })
            if (!credited.count) throw new ExpectedError("Balance limit reached.")
            await writeAudit(tx, actor.id, 'INVOICE_APPROVED', 'Invoice', invoice.id, String(invoice.amount))
            return invoice
        })
        revalidatePath('/admin/invoices', 'layout')
        revalidatePath('/invoices', 'layout')
        revalidatePath('/admin', 'layout')
        return { success: true, data: invoice }

    });
}

export async function ADMIN_RejectInvoiceAction(invoiceId: string) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        await prisma.$transaction(async tx => {
            const updated = await tx.invoice.updateMany({
                where: { id: invoiceId, status: 'WAITING_FOR_APPORVAL', paymentType: 'CREDIT' }, data: { status: 'CANCELED' },
            })
            if (!updated.count) throw new ExpectedError("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
            await writeAudit(tx, actor.id, 'INVOICE_REJECTED', 'Invoice', invoiceId)
        })
        revalidatePath('/admin/invoices', 'layout')
        revalidatePath('/invoices', 'layout')
        revalidatePath('/admin', 'layout')
        return { success: true }

    });
}
