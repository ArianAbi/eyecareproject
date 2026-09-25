"use server"

import { actionResult, ExpectedError } from "../action-result";
import { requireAdmin } from "../access"
import { writeAudit } from "../audit"

import { ActionError } from "../action-error"
import prisma from "../db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Prisma } from "@/generated/prisma/client"
import { PaginationObjectDB } from "../pagination-object"

export type AdminUserFilters = {
    page?: string
    username?: string
    number?: string
    status?: string
}

const userFilterStatusSchema = z.enum(['UNVERIFIED', 'WAITING_FOR_APPROVAL', 'VERIFIED', 'REJECTED'])

export async function ADMIN_GetUsersActions(filters: AdminUserFilters = {}) {
    try {
        await requireAdmin()

        const parsedFilters = z.object({
            username: z.string().trim().max(100).optional().catch(undefined),
            number: z.string().trim().max(20).optional().catch(undefined),
            status: userFilterStatusSchema.optional().catch(undefined),
        }).parse(filters)

        const data = await prisma.user.findMany({
            ...PaginationObjectDB(filters.page),
            where: {
                username: parsedFilters.username ? { contains: parsedFilters.username, mode: 'insensitive' } : undefined,
                number: parsedFilters.number ? { contains: parsedFilters.number } : undefined,
                userStatus: parsedFilters.status,
            },
            omit: {
                password: true,
                updatedAt: true
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
        })

        const total = await prisma.user.count({
            where: {
                username: parsedFilters.username ? { contains: parsedFilters.username, mode: 'insensitive' } : undefined,
                number: parsedFilters.number ? { contains: parsedFilters.number } : undefined, userStatus: parsedFilters.status,
            }
        })
        return { data, total }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }

        throw new ActionError({
            error: "unknown error"
        })
    }
}

export async function ADMIN_GetSingleUserAction(id: string) {
    try {
        await requireAdmin()

        const data = await prisma.user.findUnique({
            where: {
                id
            },
            omit: {
                password: true,
                updatedAt: true
            }
        })

        return data
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }

        throw new ActionError({
            error: "unknown error"
        })
    }
}

export async function ADMIN_SearchUserAction(query: string) {
    try {
        await requireAdmin()

        const data = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { number: { contains: query } }
                ]
            },
            take: 5,
            omit: {
                password: true,
                updatedAt: true
            }
        })

        return data
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }

        throw new ActionError({
            error: "unknown error"
        })
    }
}

export async function ADMIN_GetUserDetailsAction(id: string, pages: {
    invoicesPage?: string, ticketsPage?: string, ordersPage?: string, cartPage?: string, logsPage?: string,
} = {}) {
    await requireAdmin()
    const user = await prisma.user.findUnique({
        where: { id }, omit: { password: true },
        include: { _count: { select: { invoices: true, tickets: true, orders: true } } }
    })
    if (!user) return null

    // Database subqueries avoid transferring all related IDs into application memory.
    const logPage = PaginationObjectDB(pages.logsPage)
    const matchingLogs = await prisma.$queryRaw<{ id: string | null; total: bigint }[]>`
      WITH matching AS (SELECT a."id", a."createdAt" FROM "AuditLog" a
      WHERE a."actorId" = ${id} OR (a."entityType" = 'User' AND a."entityId" = ${id})
        OR (a."entityType" = 'Invoice' AND a."entityId" IN (SELECT "id" FROM "Invoice" WHERE "userId" = ${id}))
        OR (a."entityType" = 'Ticket' AND a."entityId" IN (SELECT "id" FROM "Ticket" WHERE "userId" = ${id}))
        OR (a."entityType" = 'OrderBatch' AND a."entityId" IN (SELECT "id" FROM "OrderBatch" WHERE "userId" = ${id}))
      ), total AS (SELECT COUNT(*) AS total FROM matching), page AS (
        SELECT "id" FROM matching ORDER BY "createdAt" DESC, "id" DESC LIMIT ${logPage.take}
        OFFSET LEAST(${logPage.skip}, GREATEST(0, (CEIL((SELECT total FROM total)::numeric / ${logPage.take}) - 1) * ${logPage.take}))
      ) SELECT page."id", total.total FROM total LEFT JOIN page ON true`
    const logsWhere: Prisma.AuditLogWhereInput = { id: { in: matchingLogs.flatMap(row => row.id ? [row.id] : []) } }
    const [openTickets, newOrders, cartTotal, logsTotal] = await Promise.all([
        prisma.ticket.count({ where: { userId: id, status: 'OPEN' } }),
        prisma.orderBatch.count({ where: { userId: id, status: 'PENDING' } }),
        prisma.cartItem.count({ where: { cart: { userId: id } } }),
        Promise.resolve(Number(matchingLogs[0]?.total ?? 0)),
    ])
    const pagination = (page: string | undefined, total: number) => {
        const requested = PaginationObjectDB(page)
        return { ...requested, skip: Math.min(requested.skip, Math.max(0, Math.ceil(total / requested.take) - 1) * requested.take) }
    }
    const [invoices, tickets, orders, cart, logs] = await Promise.all([
        prisma.invoice.findMany({ where: { userId: id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(pages.invoicesPage, user._count.invoices) }),
        prisma.ticket.findMany({ where: { userId: id }, include: { _count: { select: { messages: true } } }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], ...pagination(pages.ticketsPage, user._count.tickets) }),
        prisma.orderBatch.findMany({ where: { userId: id }, include: { orderItems: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(pages.ordersPage, user._count.orders) }),
        prisma.cartItem.findMany({ where: { cart: { userId: id } }, include: { product: { select: { id: true, name: true, price: true, active: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(pages.cartPage, cartTotal) }),
        prisma.auditLog.findMany({ where: logsWhere, include: { actor: { select: { username: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: logPage.take }),
    ])
    return { user, invoices, tickets, orders, cart, logs, openTickets, newOrders, cartTotal, logsTotal }
}

const statusSchema = z.enum(['UNVERIFIED', 'WAITING_FOR_APPROVAL', 'VERIFIED', 'REJECTED'])

export async function ADMIN_SetUserStatusAction(input: { id: string, status: string, expectedStatus: string }) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        const { id, status, expectedStatus } = z.object({ id: z.string().uuid(), status: statusSchema, expectedStatus: statusSchema }).parse(input)
        await prisma.$transaction(async tx => {
            const result = await tx.user.updateMany({ where: { id, userStatus: expectedStatus }, data: { userStatus: status } })
            if (!result.count) throw new ExpectedError('وضعیت حساب تغییر کرده است؛ صفحه را تازه کنید.')
            await writeAudit(tx, actor.id, 'USER_STATUS_CHANGED', 'User', id, `${expectedStatus} -> ${status}`)
        })
        revalidatePath('/admin', 'layout')
        revalidatePath('/profile')
        return { success: true }

    });
}

export async function ADMIN_AdjustUserCreditAction(input: { id: string, amount: number, expectedCredit: number, reason: string }) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        const { id, amount, expectedCredit, reason } = z.object({
            id: z.string().uuid(), amount: z.number().int().min(-2147483647).max(2147483647).refine(value => value !== 0),
            expectedCredit: z.number().int(), reason: z.string().trim().min(3).max(500),
        }).parse(input)
        const nextCredit = expectedCredit + amount
        if (!Number.isSafeInteger(nextCredit) || nextCredit < 0 || nextCredit > 2147483647) throw new ExpectedError('موجودی نهایی باید بین صفر و ۲٬۱۴۷٬۴۸۳٬۶۴۷ تومان باشد.')
        await prisma.$transaction(async tx => {
            const result = await tx.user.updateMany({ where: { id, credit: expectedCredit }, data: { credit: { increment: amount } } })
            if (!result.count) throw new ExpectedError('موجودی حساب تغییر کرده است؛ صفحه را تازه کنید و دوباره تلاش کنید.')
            await writeAudit(tx, actor.id, 'USER_CREDIT_ADJUSTED', 'User', id, `${expectedCredit} -> ${nextCredit} (${amount > 0 ? '+' : ''}${amount} تومان) | ${reason}`)
        })
        revalidatePath('/admin', 'layout')
        revalidatePath('/(main)', 'layout')
        return { success: true }

    });
}

export async function ADMIN_UpdateUserProfileAction(input: { id: string, username: string, number: string, address: string, nationalCode: string, managementName: string, storeName: string }) {
    return actionResult(async () => {

        const actor = await requireAdmin()
        const { id, ...data } = z.object({
            id: z.string().uuid(), username: z.string().trim().min(4).max(15),
            number: z.string().regex(/^09\d{9}$/), address: z.string().trim().max(1000),
            nationalCode: z.union([z.literal(''), z.string().regex(/^\d{10}$/)]),
            managementName: z.string().trim().max(100), storeName: z.string().trim().max(100),
        }).parse(input)
        await prisma.$transaction(async tx => {
            await tx.user.update({ where: { id }, data })
            await writeAudit(tx, actor.id, 'USER_PROFILE_UPDATED', 'User', id)
        })
        revalidatePath('/admin', 'layout')
        revalidatePath('/profile')
        return { success: true }

    });
}
