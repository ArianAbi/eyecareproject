import { NextResponse } from "next/server"
import { VerifyInvoicePaymentAction } from "@/lib/actions/invoices.action"

export async function GET(request: Request) {
    const url = new URL(request.url)
    try {
        const result = await VerifyInvoicePaymentAction(url.searchParams.get('Authority') ?? '', url.searchParams.get('Status') ?? '')
        return NextResponse.redirect(new URL(`/invoices/${result.invoiceId}?payment=${result.success ? 'success' : 'failed'}`, url.origin))
    } catch {
        return NextResponse.redirect(new URL('/invoices?payment=error', url.origin))
    }
}
