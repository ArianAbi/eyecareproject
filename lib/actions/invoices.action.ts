"use server"

import prisma from "../db"
import { requireUser } from "../access"
import { writeAudit } from "../audit"
import { PaginationObjectDB } from "../pagination-object"
import { invoiceWhere, type InvoiceFilters } from "../invoice-filters"
import { zarinpalRequestPayment, zarinpalVerifyPayment } from "../zarinpal"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function GetInvoicesAction(filters: InvoiceFilters = {}) {
    const user = await requireUser()
    const where = { ...invoiceWhere(filters), userId: user.id }
    const data = await prisma.$transaction(async tx => ({
        invoices: await tx.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, ...PaginationObjectDB(filters.page) }),
        total: await tx.invoice.count({ where }),
    }))
    return { success: true, data }
}

export async function GetSingleInvoiceAction(id: string) {
    const user = await requireUser()
    return { success: true, data: await prisma.invoice.findUnique({ where: { id, userId: user.id } }) }
}

export async function CreateInvoiceAction(input: { amount: number, paymentType: "CASH" | "CREDIT", orderBatchId?: string }) {
    const user = await requireUser()
    const value = z.object({ amount: z.number().int().min(1000).max(2147483647), paymentType: z.enum(['CASH', 'CREDIT']) }).parse(input)
    if (input.orderBatchId) {
        const order = await prisma.orderBatch.findUnique({ where: { id: input.orderBatchId, userId: user.id }, select: { id: true } })
        if (!order) throw new Error("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
    }
    const data = await prisma.$transaction(async tx => {
        const invoice = await tx.invoice.create({ data: { ...value, userId: user.id,
            status: value.paymentType === 'CREDIT' ? 'WAITING_FOR_APPORVAL' : 'PENDING' } })
        await writeAudit(tx, user.id, 'INVOICE_CREATED', 'Invoice', invoice.id, `${value.paymentType}: ${value.amount}`)
        return invoice
    })
    revalidatePath('/invoices')
    revalidatePath('/admin/invoices')
    return { success: true, data }
}

export async function PayInvoiceAction(invoiceId: string) {
    const user = await requireUser()
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId, userId: user.id } })
    if (!invoice || invoice.status !== 'PENDING' || invoice.paymentType !== 'CASH') throw new Error("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
    // Preserve the authority so concurrent clicks cannot overwrite a payable session.
    if (invoice.zarinpalAuthority) return { success: true, redirectUrl: paymentUrl(invoice.zarinpalAuthority) }
    const appUrl = process.env.APP_URL
    if (!appUrl) throw new Error("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
    const { authority } = await zarinpalRequestPayment({ amountToman: invoice.amount,
        description: `پرداخت فاکتور ${invoice.invoiceNumber}`, callbackUrl: new URL('/invoices/verify', appUrl).toString() })
    const data = await prisma.$transaction(async tx => {
        const result = await tx.invoice.updateMany({ where: { id: invoice.id, status: 'PENDING', zarinpalAuthority: null }, data: { zarinpalAuthority: authority } })
        if (result.count) await writeAudit(tx, user.id, 'PAYMENT_STARTED', 'Invoice', invoice.id)
        return tx.invoice.findUniqueOrThrow({ where: { id: invoice.id } })
    })
    if (data.status !== 'PENDING' || !data.zarinpalAuthority) throw new Error("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
    return { success: true, redirectUrl: paymentUrl(data.zarinpalAuthority) }
}

function paymentUrl(authority: string) {
    const host = process.env.ZARINPAL_SANDBOX !== 'false' ? 'https://sandbox.zarinpal.com' : 'https://www.zarinpal.com'
    return `${host}/pg/StartPay/${encodeURIComponent(authority)}`
}

export async function VerifyInvoicePaymentAction(authority: string, status: string) {
    const user = await requireUser()
    if (!authority || authority.length > 200) throw new Error("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
    const invoice = await prisma.invoice.findUnique({ where: { zarinpalAuthority: authority, userId: user.id } })
    if (!invoice || invoice.paymentType !== 'CASH') throw new Error("درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد")
    if (invoice.status === 'PAID') return { success: true, invoiceId: invoice.id }
    if (status !== 'OK' || invoice.status !== 'PENDING') return { success: false, invoiceId: invoice.id }
    const verified = await zarinpalVerifyPayment({ amountToman: invoice.amount, authority })
    if (!verified.success) return { success: false, invoiceId: invoice.id }
    await prisma.$transaction(async tx => {
        const updated = await tx.invoice.updateMany({ where: { id: invoice.id, status: 'PENDING', zarinpalAuthority: authority },
            data: { status: 'PAID', paidAt: new Date(), zarinpalRefId: String(verified.refId) } })
        if (!updated.count) return
        await tx.user.update({ where: { id: invoice.userId }, data: { credit: { increment: invoice.amount } } })
        await writeAudit(tx, user.id, 'PAYMENT_VERIFIED', 'Invoice', invoice.id, String(invoice.amount))
    })
    revalidatePath('/invoices', 'layout')
    revalidatePath('/admin/invoices', 'layout')
    revalidatePath('/admin/summary')
    return { success: true, invoiceId: invoice.id }
}
