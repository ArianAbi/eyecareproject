import { InvoiceControls } from "@/components/core/InvoiceControls"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GetSingleInvoiceAction } from "@/lib/actions/invoices.action";
import { InvoiceStatusFarsi, InvoicePaymentTypeFarsi } from "@/lib/invoice-status-farsi-map";
import { cn } from "@/lib/utils";
import { format } from "date-fns-jalali";
import { notFound } from "next/navigation";

export default async function InvoiceDetailPage({ params }: {
    params: Promise<{
        id: string
    }>
}) {
    const { id } = await params

    const invoice = await GetSingleInvoiceAction(id)

    if (!invoice.data) return notFound()

    const { text, bg } = InvoiceStatusFarsi(invoice.data.status)

    return <div className="p-3 space-y-4">
        <Link href="/invoices" className="text-sm underline">بازگشت به صورتحساب‌ها</Link>
        <h2 className="mb-2">فاکتور شماره {invoice.data.invoiceNumber}</h2>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>جزئیات فاکتور</span>
                    <div className="flex items-center">
                        <div className={cn(bg, 'size-3 rounded-full me-1')}></div>
                        <span className="text-sm">{text}</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <div className="text-sm text-muted-foreground mb-1">مبلغ</div>
                    <div>
                        <span>{invoice.data.amount.toLocaleString() + " "}</span>
                        <span className="text-xs text-emerald-500 font-semibold">تومان</span>
                    </div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground mb-1">نوع پرداخت</div>
                    <div>{InvoicePaymentTypeFarsi(invoice.data.paymentType)}</div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground mb-1">تاریخ صدور</div>
                    <div>{format(invoice.data.createdAt, "yyyy/MM/dd")}</div>
                </div>

                <div>
                    <div className="text-sm text-muted-foreground mb-1">مهلت پرداخت</div>
                    <div>
                        {invoice.data.dueDate
                            ? format(invoice.data.dueDate, "yyyy/MM/dd")
                            : <span className="italic text-muted-foreground">---</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
        {invoice.data.zarinpalRefId && <p>کد پیگیری: {invoice.data.zarinpalRefId}</p>}
        {invoice.data.status === 'PENDING' && invoice.data.paymentType === 'CASH' && <InvoiceControls id={id} />}
    </div>
}
