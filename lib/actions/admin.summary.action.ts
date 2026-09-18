"use server"

import prisma from "../db"
import { requireAdmin } from "../access"
import { parseDateFilterParam, tehranDay, validDay } from "../prisma-date-filter"
import { PaginationObjectDB } from "../pagination-object"

export async function ADMIN_GetSummaryAction(rawDay?: string, page?: string) {
    await requireAdmin()
    const day = validDay(rawDay) ? rawDay : tehranDay()
    const range = parseDateFilterParam(JSON.stringify({ from: day }))!
    return prisma.$transaction(async tx => {
        const [orders, total, statuses, items, delivery, tickets] = await Promise.all([
            tx.orderBatch.findMany({ where: { createdAt: range }, ...PaginationObjectDB(page, 20), orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true } }, orderItems: { select: { purchasedPrice: true, cutPrice: true, odOnly: true } } } }),
            tx.orderBatch.count({ where: { createdAt: range } }),
            tx.orderBatch.groupBy({ by: ['status'], where: { createdAt: range }, _count: true }),
            tx.orderItem.aggregate({ where: { orderBatch: { createdAt: range } }, _sum: { purchasedPrice: true, cutPrice: true }, _count: true }),
            tx.orderBatch.aggregate({ where: { createdAt: range }, _sum: { deliveryPrice: true } }),
            tx.ticket.groupBy({ by: ['status'], _count: true }),
        ])
        return { day, orders, total, statuses, itemCount: items._count,
            orderTotal: (items._sum.purchasedPrice ?? 0) + (items._sum.cutPrice ?? 0) + (delivery._sum.deliveryPrice ?? 0), tickets }
    })
}

export async function ADMIN_GetFinancialSummaryAction(rawDay?: string) {
    await requireAdmin()
    const day = validDay(rawDay) ? rawDay : tehranDay()
    const first = new Date(`${day}T12:00:00Z`)
    first.setUTCDate(first.getUTCDate() - 13)
    const from = first.toISOString().slice(0, 10)
    const range = parseDateFilterParam(JSON.stringify({ from, to: day }))!
    const data = await prisma.$transaction(async tx => {
        const [paid, pending, balances] = await Promise.all([
            tx.invoice.findMany({ where: { status: 'PAID', paidAt: range }, select: { amount: true, paymentType: true, paidAt: true } }),
            tx.invoice.aggregate({ where: { status: 'WAITING_FOR_APPORVAL', paymentType: 'CREDIT' }, _sum: { amount: true }, _count: true }),
            tx.user.aggregate({ _sum: { credit: true } }),
        ])
        return { paid, pending, balances }
    })
    const series = Array.from({ length: 14 }, (_, i) => {
        const date = new Date(first)
        date.setUTCDate(date.getUTCDate() + i)
        return { day: date.toISOString().slice(0, 10), cash: 0, credit: 0 }
    })
    for (const invoice of data.paid) {
        const entry = series.find(s => s.day === tehranDay(invoice.paidAt!))
        if (entry) entry[invoice.paymentType === 'CASH' ? 'cash' : 'credit'] += invoice.amount
    }
    return { day, series, pendingAmount: data.pending._sum.amount ?? 0, pendingCount: data.pending._count,
        totalBalance: data.balances._sum.credit ?? 0,
        cashTotal: series.reduce((sum, row) => sum + row.cash, 0), creditTotal: series.reduce((sum, row) => sum + row.credit, 0) }
}
