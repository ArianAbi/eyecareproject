"use server";

import { z } from "zod";
import prisma from "../db";
import { auth } from "../Auth";
import { requireAdmin } from "../access";
import { writeAudit } from "../audit";

export async function UpdateCartItemGuaranteeAction(itemId: string, name: string, adminUserId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("ابتدا وارد حساب شوید");
  let userId = session.user.id;
  if (adminUserId !== undefined) {
    await requireAdmin();
    userId = z.string().uuid().parse(adminUserId);
  }
  itemId = z.string().uuid().parse(itemId);
  const guaranteeClientName = z.string().trim().max(200).parse(name);
  await prisma.$transaction(async tx => {
    await tx.cartItem.update({
      where: { id: itemId, cart: { userId }, product: { includesGuarantee: true } },
      data: { guaranteeClientName },
    });
    await writeAudit(tx, session.user.id!, "CART_GUARANTEE_UPDATED", "CartItem", itemId);
  });
  return { guaranteeClientName };
}
