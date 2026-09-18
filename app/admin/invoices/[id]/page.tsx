import Link from "next/link"
import { notFound } from "next/navigation"
import { ADMIN_GetSingleInvoiceAction } from "@/lib/actions/admin.invoices.action"
import { InvoiceStatusFarsi, InvoicePaymentTypeFarsi } from "@/lib/invoice-status-farsi-map"
import { InvoiceControls } from "@/components/core/InvoiceControls"
import { Card, CardContent } from "@/components/ui/card"

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const invoice = await ADMIN_GetSingleInvoiceAction((await params).id)
    if (!invoice) notFound()
    return <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/admin/invoices" className="underline">بازگشت به صورتحساب‌ها</Link>
        <h1 className="text-xl font-semibold">صورتحساب #{invoice.invoiceNumber}</h1>
        <Card><CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <p>کاربر: {invoice.user.username}</p><p>مبلغ: {invoice.amount.toLocaleString('fa-IR')} تومان</p>
            <p>روش: {InvoicePaymentTypeFarsi(invoice.paymentType)}</p><p>وضعیت: {InvoiceStatusFarsi(invoice.status).text}</p>
            <p>تاریخ: {new Intl.DateTimeFormat('fa-IR').format(invoice.createdAt)}</p><p>کد پیگیری: {invoice.zarinpalRefId ?? '—'}</p>
        </CardContent></Card>
        {invoice.status === 'WAITING_FOR_APPORVAL' && invoice.paymentType === 'CREDIT' && <InvoiceControls id={invoice.id} admin />}
    </div>
}
