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
            tx.orderBatch.findMany({
                where: { createdAt: range }, ...PaginationObjectDB(page, 20), orderBy: { createdAt: 'desc' },
                include: { user: { select: { username: true } }, orderItems: { select: { purchasedPrice: true, cutPrice: true, odOnly: true } } }
            }),
            tx.orderBatch.count({ where: { createdAt: range } }),
            tx.orderBatch.groupBy({ by: ['status'], where: { createdAt: range }, _count: true }),
            tx.orderItem.aggregate({ where: { orderBatch: { createdAt: range } }, _sum: { purchasedPrice: true, cutPrice: true }, _count: true }),
            tx.orderBatch.aggregate({ where: { createdAt: range }, _sum: { deliveryPrice: true } }),
            tx.ticket.groupBy({ by: ['status'], _count: true }),
        ])
        return {
            day, orders, total, statuses, itemCount: items._count,
            orderTotal: (items._sum.purchasedPrice ?? 0) + (items._sum.cutPrice ?? 0) + (delivery._sum.deliveryPrice ?? 0), tickets
        }
    })
}

// Keep your existing imports (prisma, requireAdmin, validDay, tehranDay, parseDateFilterParam).
//
// NOTE: if this lives in a 'use server' file, only async functions may be *exported*
// at runtime. Exporting the `FinancialRange` type is fine (types are erased), but
// keep RANGES and the helpers below non-exported.
//
// Calendar rules:
//   - "month" and "year" are Jalali (Tehran time zone)
//   - series keys: hour  -> 'HH'
//                  day   -> 'YYYY-MM-DD'  (Jalali)
//                  month -> 'YYYY-MM'     (Jalali)
//   - `from` / `to` / `day` in the result are Gregorian 'YYYY-MM-DD' (same format as tehranDay())

export type FinancialRange = 'all time' | 'this year' | 'months' | 'this month' | 'today'
type Bucket = 'hour' | 'day' | 'month'
type JDate = { y: number; m: number; d: number }

const RANGES: readonly FinancialRange[] = ['all time', 'this year', 'months', 'this month', 'today']

// Uses the runtime's ICU Persian calendar (Node ships full ICU), so no extra dependency
const jalaliFmt = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric'
})
const tehranHourFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tehran', hour: '2-digit', hourCycle: 'h23'
})

function toJalali(date: Date): JDate {
    const p: Record<string, string> = {}
    for (const part of jalaliFmt.formatToParts(date)) p[part.type] = part.value
    return { y: +p.year, m: +p.month, d: +p.day }
}

// Gregorian 'YYYY-MM-DD' helpers (noon UTC is the same calendar day in Tehran)
const noon = (day: string) => new Date(`${day}T12:00:00Z`)
function addDays(day: string, n: number) {
    const d = noon(day)
    d.setUTCDate(d.getUTCDate() + n)
    return d.toISOString().slice(0, 10)
}

const pad = (n: number) => String(n).padStart(2, '0')
const monthKey = (j: Pick<JDate, 'y' | 'm'>) => `${j.y}-${pad(j.m)}`
const dayKey = (j: JDate) => `${monthKey(j)}-${pad(j.d)}`

// one Jalali day key for every Gregorian day from..to (inclusive)
function dayKeys(from: string, to: string) {
    const keys: string[] = []
    for (let d = from; d <= to; d = addDays(d, 1)) keys.push(dayKey(toJalali(noon(d))))
    return keys
}

// one Jalali month key for every month from start..end (inclusive)
function monthKeys(start: JDate, end: JDate) {
    const keys: string[] = []
    let { y, m } = start
    while (y < end.y || (y === end.y && m <= end.m)) {
        keys.push(monthKey({ y, m }))
        if (++m > 12) { m = 1; y++ }
    }
    return keys
}

function bucketKey(bucket: Bucket, paidAt: Date) {
    if (bucket === 'hour') return tehranHourFmt.format(paidAt) // '00'..'23'
    const j = toJalali(paidAt)
    return bucket === 'day' ? dayKey(j) : monthKey(j)
}

export async function ADMIN_GetFinancialSummaryAction(rawRange?: FinancialRange, rawDay?: string) {
    await requireAdmin()

    const range: FinancialRange = RANGES.includes(rawRange as FinancialRange) ? rawRange! : 'this month'
    const day = validDay(rawDay) ? rawDay : tehranDay() // the "as of" day (Gregorian), today by default
    const now = toJalali(noon(day))

    const bucket: Bucket = range === 'today' ? 'hour' : range === 'this month' ? 'day' : 'month'

    // First day of the window (Gregorian); null = no lower bound (all time), resolved from the data below
    let from: string | null
    switch (range) {
        case 'today':
            from = day
            break
        case 'this month': // 1st of the current Jalali month
            from = addDays(day, -(now.d - 1))
            break
        case 'this year': { // 1 Farvardin. Months 1-6 have 31 days and 7-11 have 30, so no leap-year handling needed
            const dayOfYear = now.m <= 6 ? (now.m - 1) * 31 + now.d : 186 + (now.m - 7) * 30 + now.d
            from = addDays(day, -(dayOfYear - 1))
            break
        }
        case 'months': { // 1st of the Jalali month 11 months back => last 12 months incl. the current one
            let start = addDays(day, -(now.d - 1))
            for (let i = 0; i < 11; i++) {
                const prevLast = addDays(start, -1)
                start = addDays(prevLast, -(toJalali(noon(prevLast)).d - 1))
            }
            from = start
            break
        }
        default: // 'all time'
            from = null
    }

    const paidAtFilter = from ? parseDateFilterParam(JSON.stringify({ from, to: day }))! : undefined

    const data = await prisma.$transaction(async tx => {
        const [paid, pending, balances] = await Promise.all([
            tx.invoice.findMany({
                where: {
                    status: 'PAID',
                    paidAt: paidAtFilter ?? { not: null }
                },
                select: {
                    amount: true,
                    paymentType: true,
                    paidAt: true
                }
            }),
            // current snapshot, not range-dependent
            tx.invoice.aggregate({
                where: {
                    status: 'WAITING_FOR_APPORVAL',
                    paymentType: 'CREDIT'
                },
                _sum: {
                    amount: true
                },
                _count: true
            }),
            // current snapshot, not range-dependent
            tx.user.aggregate({ _sum: { credit: true } }),
        ])
        return { paid, pending, balances }
    })

    // "all time" starts at the month of the first paid invoice
    let start = from
    if (start === null) {
        const firstPaid = data.paid.reduce<Date | null>(
            (min, inv) => (!min || inv.paidAt! < min ? inv.paidAt! : min), null)
        start = firstPaid ? tehranDay(firstPaid) : day
    }

    const keys =
        bucket === 'hour' ? Array.from({ length: 24 }, (_, h) => pad(h))
            : bucket === 'day' ? dayKeys(start, day)
                : monthKeys(toJalali(noon(start)), now)

    const series = keys.map(key => ({ key, cash: 0, credit: 0 }))
    const byKey = new Map(series.map(s => [s.key, s]))

    for (const invoice of data.paid) {
        const entry = byKey.get(bucketKey(bucket, invoice.paidAt!))
        if (entry) entry[invoice.paymentType === 'CASH' ? 'cash' : 'credit'] += invoice.amount
    }

    return {
        range, bucket, from: start, to: day, day, series,
        pendingAmount: data.pending._sum.amount ?? 0, pendingCount: data.pending._count,
        totalBalance: data.balances._sum.credit ?? 0,
        cashTotal: series.reduce((sum, row) => sum + row.cash, 0),
        creditTotal: series.reduce((sum, row) => sum + row.credit, 0)
    }
}
