import { DataTable } from "@/components/ui/data-table";
import { GetInvoicesAction } from "@/lib/actions/invoices.action";
import { InvoicesColumn } from "./column";
import CustomPagination from "@/components/core/CustomPagination";
import { NewInvoiceForm } from "./NewInvoiceForm";

export default async function InvoicesPage({ searchParams }: {
    searchParams: Promise<{
        page?: number
    }>
}) {
    const params = await searchParams

    const invoices = await GetInvoicesAction({
        page: params.page
    })

    return <>
        <div className="p-3">
            <h2 className="mb-2">فاکتورها</h2>

            <NewInvoiceForm />

            <DataTable data={invoices.data.invoices} columns={InvoicesColumn} />
            <CustomPagination
                total={invoices.data.total}
                paramKey="page"
            />

        </div>
    </>
}
