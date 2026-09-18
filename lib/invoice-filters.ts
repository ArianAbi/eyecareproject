import type { Prisma } from "@/generated/prisma/client"
import { parseDateFilterParam } from "./prisma-date-filter"

export type InvoiceFilters = { page?: string | number, status?: string, paymentType?: string, userId?: string, date?: string }
export function invoiceWhere(filters: InvoiceFilters): Prisma.InvoiceWhereInput {
    const status = ['PENDING', 'WAITING_FOR_APPORVAL', 'PAID', 'CANCELED'].find(s => s === filters.status) as Prisma.InvoiceWhereInput['status']
    const paymentType = filters.paymentType === 'CREDIT' || filters.paymentType === 'CASH' ? filters.paymentType : undefined
    return { status, paymentType, userId: filters.userId, createdAt: parseDateFilterParam(filters.date) }
}
