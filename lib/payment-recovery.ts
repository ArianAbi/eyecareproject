import "server-only";
import prisma from "./db";
import { writeAudit } from "./audit";
import { ExpectedError } from "./action-result";
import { zarinpalVerifyPayment } from "./zarinpal";

/** Invoice lock + conditional credit write make retries safe, including delayed balance headroom. */
export async function applyInvoiceCredit(invoiceId: string) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${invoiceId} FOR UPDATE`;
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    if (invoice.status !== "PAID") return false;
    if (invoice.creditAppliedAt) return true;
    const credited = await tx.user.updateMany({ where: { id: invoice.userId, credit: { lte: 2147483647 - invoice.amount } }, data: { credit: { increment: invoice.amount } } });
    if (!credited.count) return false;
    await tx.invoice.update({ where: { id: invoiceId }, data: { creditAppliedAt: new Date() } });
    await writeAudit(tx, invoice.userId, "PAYMENT_CREDIT_APPLIED", "Invoice", invoiceId, String(invoice.amount));
    return true;
  });
}

/** Authority is a locator only: provider verification, never browser status, proves payment. */
export async function reconcilePayment(authority: string) {
  if (!/^[A-Za-z0-9]{20,100}$/.test(authority)) throw new ExpectedError("Invalid payment reference.");
  const attempt = await prisma.paymentAttempt.findUnique({ where: { authority }, include: { invoice: true } });
  if (!attempt || attempt.invoice.paymentType !== "CASH") throw new ExpectedError("Payment not found.");
  const invoice = attempt.invoice;
  if (invoice.status !== "PAID") {
    const verified = await zarinpalVerifyPayment({ authority, amountToman: invoice.amount });
    await prisma.paymentAttempt.update({ where: { authority }, data: { checkedAt: new Date() } });
    if (!verified.success) return { success: false, invoiceId: invoice.id, creditApplied: false };
    await prisma.$transaction(async tx => {
      const updated = await tx.invoice.updateMany({ where: { id: invoice.id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date(), zarinpalRefId: verified.refId } });
      await tx.paymentAttempt.update({ where: { authority }, data: { status: "VERIFIED", checkedAt: new Date() } });
      if (updated.count) await writeAudit(tx, invoice.userId, "PAYMENT_VERIFIED", "Invoice", invoice.id, String(invoice.amount));
    });
  }
  const creditApplied = await applyInvoiceCredit(invoice.id);
  return { success: true, invoiceId: invoice.id, creditApplied };
}
