import prisma from "./db"
import { PaginationObjectDB } from "./pagination-object"

export async function getCreditLedger(userId: string, page?: string) {
  const total = await prisma.creditTransaction.count({ where: { userId } })
  const requested = PaginationObjectDB(page)
  const skip = Math.min(requested.skip, Math.max(0, Math.ceil(total / requested.take) - 1) * requested.take)
  const rows = await prisma.creditTransaction.findMany({
    where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: requested.take, skip,
  })
  return { rows, total }
}
