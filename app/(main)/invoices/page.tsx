import { InvoiceList } from "@/components/core/InvoiceList"
import { NewInvoiceForm } from "./NewInvoiceForm"
import type { InvoiceFilters } from "@/lib/invoice-filters"
import { requireUser } from "@/lib/access"
import prisma from "@/lib/db"

export default async function InvoicesPage({ searchParams }: {
    searchParams: Promise<InvoiceFilters & {
        payment?: string,
        addCreditOpen?: string
    }>
}) {
    const params = await searchParams

    const user = await requireUser()
    const account = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { credit: true } })

    return <div className="space-y-4 p-4">
        <h1 className="text-xl font-semibold">
            صورتحساب‌ها و موجودی
        </h1>
        {/* <p className="rounded-lg border bg-card p-4">
            موجودی فعلی: <strong>{account.credit.toLocaleString('fa-IR')}</strong> تومان
        </p> */}
        {
            params.payment === 'error' &&
            <p role="alert" className="text-xs md:text-sm p-3 w-fit bg-red-500/50 border-red-500 rounded-lg border-2">
                تایید پرداخت انجام نشد. وارد حساب خود شوید و در صورت کسر وجه، از طریق تیکت پیگیری کنید.
            </p>
        }

        <NewInvoiceForm
            defaultOpen={Boolean(params.addCreditOpen)}
            defaultOpenParamKey="addCreditOpen"
        />
        <InvoiceList filters={params} />
    </div>
}
