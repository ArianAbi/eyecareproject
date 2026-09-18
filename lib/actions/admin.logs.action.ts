"use server"

import prisma from "../db"
import { requireAdmin } from "../access"
import { PaginationObjectDB } from "../pagination-object"
import { parseDateFilterParam } from "../prisma-date-filter"

export async function ADMIN_GetLogsAction(filters: { page?: string, userId?: string, date?: string, action?: string, entityType?: string }) {
    await requireAdmin()
    const where = { actorId: filters.userId, createdAt: parseDateFilterParam(filters.date),
        action: filters.action || undefined, entityType: filters.entityType || undefined }
    return prisma.$transaction(async tx => ({
        logs: await tx.auditLog.findMany({ where, ...PaginationObjectDB(filters.page), orderBy: { createdAt: 'desc' },
            include: { actor: { select: { username: true } } } }),
        total: await tx.auditLog.count({ where }),
    }))
}
