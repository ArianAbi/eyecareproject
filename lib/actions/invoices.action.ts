"use server";

import { actionResult, ExpectedError } from "../action-result";
import prisma from "../db";
import { requireUser } from "../access";
import { writeAudit } from "../audit";
import { PaginationObjectDB } from "../pagination-object";
import { invoiceWhere, type InvoiceFilters } from "../invoice-filters";
import { paymentUrl, zarinpalRequestPayment, zarinpalInquiry } from "../zarinpal";
import { reconcilePayment, applyInvoiceCredit } from "../payment-recovery";
import { allowOperation } from "../rate-limit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BALE_SendMessage } from "../bale";
import { emojis } from "../emojis";
import { bale_hashtags } from "../bale-hashtags";

export async function GetInvoicesAction(filters: InvoiceFilters = {}) {
    const user = await requireUser();
    const where = { ...invoiceWhere(filters), userId: user.id };
    const data = await prisma.$transaction(async (tx) => ({
        invoices: await tx.invoice.findMany({
            where,
            orderBy: { createdAt: "desc" },
            ...PaginationObjectDB(filters.page),
        }),
        total: await tx.invoice.count({ where }),
    }));
    return { success: true, data };
}

export async function GetSingleInvoiceAction(id: string) {
    const user = await requireUser();
    return {
        success: true,
        data: await prisma.invoice.findUnique({ where: { id, userId: user.id } }),
    };
}

export async function CreateInvoiceAction(input: {
    amount: number;
    paymentType: "CASH" | "CREDIT";
    orderBatchId?: string;
}) {
    return actionResult(async () => {

        const user = await requireUser();
        const value = z
            .object({
                amount: z.number().int().min(1000).max(2147483647),
                paymentType: z.enum(["CASH", "CREDIT"]),
            })
            .parse(input);
        if (input.orderBatchId) {
            const order = await prisma.orderBatch.findUnique({
                where: { id: input.orderBatchId, userId: user.id },
                select: { id: true },
            });
            if (!order)
                throw new ExpectedError(
                    "درخواست نامعتبر است یا امکان انجام این عملیات وجود ندارد",
                );
        }
        const data = await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.create({
                data: {
                    ...value,
                    userId: user.id,
                    status:
                        value.paymentType === "CREDIT" ? "WAITING_FOR_APPORVAL" : "PENDING",
                },
            });
            await writeAudit(
                tx,
                user.id,
                "INVOICE_CREATED",
                "Invoice",
                invoice.id,
                `${value.paymentType}: ${value.amount}`,
            );
            return invoice;
        });

        await BALE_SendMessage(`${emojis.recipt} درخواست افزایش موجودی
                    کاربر : ${user.username}
                    مبلغ درخواستی : ${input.amount.toLocaleString()}

                    ${bale_hashtags.credit_request}
                    `);

        revalidatePath("/invoices");
        revalidatePath("/admin/invoices");
        revalidatePath("/admin", "layout");
        return { success: true, data };

    });
}

export async function PayInvoiceAction(invoiceId: string) {
    return actionResult(async () => {
        const user = await requireUser();
        z.string().uuid().parse(invoiceId);
        if (!await allowOperation("payment", user.id, 10)) throw new ExpectedError("Too many payment attempts. Try later.");
        let invoice = await prisma.invoice.findUnique({ where: { id: invoiceId, userId: user.id } });
        if (!invoice || invoice.paymentType !== "CASH") throw new ExpectedError("Invoice not found.");
        if (invoice.status === "PAID") {
            await applyInvoiceCredit(invoice.id);
            return { success: true as const, redirectUrl: `/invoices/${invoice.id}` };
        }
        if (invoice.status !== "PENDING") throw new ExpectedError("Invoice is not payable.");
        if (invoice.zarinpalAuthority) {
            const result = await reconcilePayment(invoice.zarinpalAuthority);
            if (result.success) return { success: true as const, redirectUrl: `/invoices/${invoice.id}` };
            const attempt = await prisma.paymentAttempt.findUniqueOrThrow({ where: { authority: invoice.zarinpalAuthority } });
            if (Date.now() - attempt.createdAt.getTime() < 15 * 60000) return { success: true as const, redirectUrl: paymentUrl(attempt.authority) };
            // Age triggers inquiry, never an assumption that the authority expired.
            const status = await zarinpalInquiry(attempt.authority);
            if (status !== "FAILED") throw new ExpectedError("Payment is still active or its status is uncertain. Retry reconciliation later.");
            await prisma.$transaction(async tx => {
                await tx.invoice.updateMany({ where: { id: invoiceId, status: "PENDING", zarinpalAuthority: attempt.authority }, data: { zarinpalAuthority: null } });
                await tx.paymentAttempt.updateMany({ where: { authority: attempt.authority, status: "PENDING" }, data: { status: "FAILED", checkedAt: new Date() } });
            });
        }
        const appUrl = process.env.APP_URL;
        if (!appUrl) throw new ExpectedError("Payment callback is not configured.");
        const authority = await prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${invoiceId} FOR UPDATE`;
            invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId, userId: user.id } });
            if (invoice.status !== "PENDING") throw new ExpectedError("Invoice is no longer payable.");
            if (invoice.zarinpalAuthority) return invoice.zarinpalAuthority;
            const account = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { credit: true } });
            if (account.credit > 2147483647 - invoice.amount) throw new ExpectedError("Balance limit reached. Contact support before paying.");
            const payment = await zarinpalRequestPayment({ amountToman: invoice.amount, description: `Invoice ${invoice.invoiceNumber}`, callbackUrl: new URL("/invoices/verify", appUrl).toString() });
            await tx.paymentAttempt.create({ data: { authority: payment.authority, invoiceId } });
            await tx.invoice.update({ where: { id: invoiceId }, data: { zarinpalAuthority: payment.authority } });
            await writeAudit(tx, user.id, "PAYMENT_STARTED", "Invoice", invoiceId);
            return payment.authority;
        }, { timeout: 20000 });
        return { success: true as const, redirectUrl: paymentUrl(authority) };
    });
}

export async function ReconcileInvoiceAction(invoiceId: string) {
    return actionResult(async () => {
        const user = await requireUser();
        const invoice = await prisma.invoice.findUnique({ where: { id: z.string().uuid().parse(invoiceId), userId: user.id } });
        if (!invoice || invoice.paymentType !== "CASH") throw new ExpectedError("Invoice not found.");
        if (!await allowOperation("reconcile", user.id, 10)) throw new ExpectedError("Too many attempts. Try later.");
        if (invoice.status === "PAID") await applyInvoiceCredit(invoice.id);
        else if (invoice.zarinpalAuthority) await reconcilePayment(invoice.zarinpalAuthority);
        revalidatePath("/invoices", "layout"); revalidatePath("/admin/invoices", "layout");
        return { success: true as const };
    });
}
