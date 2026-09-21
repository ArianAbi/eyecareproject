import { InvoiceList } from "@/components/core/InvoiceList"
import { NewInvoiceForm } from "./NewInvoiceForm"
import type { InvoiceFilters } from "@/lib/invoice-filters"
import TextError from "@/components/TextError"

export default async function InvoicesPage({ searchParams }: {
    searchParams: Promise<InvoiceFilters & {
        payment?: string,
        addCreditOpen?: string
    }>
}) {
    const params = await searchParams

    return <div className="space-y-4 p-4">
        <h1 className="text-xl font-semibold">
            صورتحساب‌ها و موجودی
        </h1>
        {/* <p className="rounded-lg border bg-card p-4">
            موجودی فعلی: <strong>{account.credit.toLocaleString('fa-IR')}</strong> تومان
        </p> */}
        {
            params.payment === 'error' &&
            <TextError>
                تایید پرداخت انجام نشد. وارد حساب خود شوید و در صورت کسر وجه، از طریق تیکت پیگیری کنید.
            </TextError>
        }

        <InvoiceList filters={params} >
            <NewInvoiceForm
                defaultOpen={Boolean(params.addCreditOpen)}
                defaultOpenParamKey="addCreditOpen"
            />
        </InvoiceList>
    </div>
}
