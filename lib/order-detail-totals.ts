import prisma from "./db";
export async function orderDetailTotals(id: string, deliveryPrice: number) {
  const groups = await prisma.orderItem.groupBy({ by: ["odOnly"], where: { orderBatchId: id }, _sum: { purchasedPrice: true, cutPrice: true }, _count: true });
  return { totalPrice: groups.reduce((sum, row) => sum + (row._sum.purchasedPrice ?? 0) + (row._sum.cutPrice ?? 0), deliveryPrice), lensCount: groups.reduce((sum, row) => sum + row._count * (row.odOnly ? 1 : 2), 0) };
}
