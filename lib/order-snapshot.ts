import { z } from "zod";
const snapshot = z.object({ name: z.string(), includesBag: z.boolean(), includesCleaningCloth: z.boolean(), includesCleaningSpray: z.boolean(), categoryRel: z.object({ name: z.string(), color: z.string() }) });
export function productSnapshot(product: z.infer<typeof snapshot>) { return snapshot.parse(product); }
export function restoreOrderSnapshots<T extends { orderItems: { productSnapshot: unknown; product: z.infer<typeof snapshot> }[] }>(order: T | null): T | null {
  if (!order) return order;
  return { ...order, orderItems: order.orderItems.map(item => {
    const parsed = snapshot.safeParse(item.productSnapshot);
    return { ...item, product: parsed.success ? { ...item.product, ...parsed.data } : item.product };
  }) };
}
