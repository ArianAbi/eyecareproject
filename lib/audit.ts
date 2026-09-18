import type { Prisma } from "@/generated/prisma/client"

// Only explicit event descriptions belong here; never passwords, tokens or message bodies.
export async function writeAudit(tx: Pick<Prisma.TransactionClient, "auditLog">, actorId: string | null,
    action: string, entityType: string, entityId?: string, detail?: string) {
    await tx.auditLog.create({ data: { actorId, action, entityType, entityId, detail } })
}
