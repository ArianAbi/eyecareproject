"use server"

import { ActionError } from "../action-error"
import { auth } from "../Auth"
import prisma from "../db"
import { PaginationObjectDB } from "../pagination-object"
import { zarinpalRequestPayment } from "../zarinpal"

export async function GetInvoicesAction(filters: {
    page?: number
}) {
    try {
        const session = await auth()

        if (!session || !session.user) {
            throw Error("you are not logged in")
        }

        const data = await prisma.$transaction(async tnx => {

            const invoices = await tnx.invoice.findMany({
                where: {
                    userId: session.user.id
                },
                orderBy: {
                    createdAt: 'desc'
                },
                ...(PaginationObjectDB(filters.page))
            })

            const total = await tnx.invoice.count({
                where: {
                    userId: session.user.id
                }
            })

            return { invoices, total }
        })

        return { success: true, data }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "get invoices:unknown error"
        })
    }
}

export async function GetSingleInvoiceAction(id: string) {
    try {
        const session = await auth()

        if (!session || !session.user.id) throw new ActionError({
            error: "شما در هیچ حسابی لاگین نیستید"
        })

        const data = await prisma.invoice.findUnique({
            where: {
                id,
                userId: session.user.id
            }
        })

        return { success: true, data }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "get single invoice:unknown error"
        })
    }
}

// Creates a new invoice. CASH kicks off a ZarinPal payment session and returns
// a redirect URL to the gateway. CREDIT just creates a PENDING invoice for an
// admin to review later — no balance change happens until it's approved.
export async function CreateInvoiceAction(input: {
    amount: number
    paymentType: "CASH" | "CREDIT"
    orderBatchId?: string
}) {
    try {
        const session = await auth()
        if (!session || !session.user.id) {
            throw new Error("شما در هیچ حسابی لاگین نیستید")
        }

        if (!input.amount || input.amount <= 0) {
            throw new Error("مبلغ نامعتبر است")
        }

        // if (input.orderBatchId) {
        //     const order = await prisma.orderBatch.findUnique({
        //         where: {
        //             id: input.orderBatchId,
        //             userId: session.user.id
        //         }
        //     })
        //     if (!order) throw new Error("سفارش یافت نشد")
        // }

        const invoice = await prisma.invoice.create({
            data: {
                userId: session.user.id,
                amount: input.amount,
                paymentType: input.paymentType,
                status: input.paymentType == 'CREDIT' ? 'WAITING_FOR_APPORVAL' : 'PENDING'
            }
        })

        return { success: true, data: invoice }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "create invoice:unknown error"
        })
    }
}

// Re-initiates a ZarinPal payment session for an existing PENDING cash invoice
// (e.g. the user's first attempt was canceled or failed on the gateway side).
export async function PayInvoiceAction(invoiceId: string) {
    try {
        const session = await auth()
        if (!session || !session.user.id) {
            throw new Error("شما در هیچ حسابی لاگین نیستید")
        }

        const invoice = await prisma.invoice.findUnique({
            where: {
                id: invoiceId,
                userId: session.user.id
            }
        })

        if (!invoice) throw new Error("فاکتور یافت نشد")
        if (invoice.status !== "PENDING") throw new Error("این فاکتور قابل پرداخت نیست")
        if (invoice.paymentType !== "CASH") throw new Error("این فاکتور اعتباری است و توسط ادمین بررسی می‌شود")

        const callbackUrl = `${process.env.APP_URL}/invoices/verify`

        const { authority, paymentUrl } = await zarinpalRequestPayment({
            amountToman: invoice.amount,
            description: `پرداخت فاکتور شماره ${invoice.invoiceNumber}`,
            callbackUrl
        })

        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { zarinpalAuthority: authority }
        })

        return { success: true, redirectUrl: paymentUrl }
    } catch (err) {
        if (err instanceof Error) {
            throw new ActionError({
                error: err.message
            })
        }
        throw new ActionError({
            error: "pay invoice:unknown error"
        })
    }
}
