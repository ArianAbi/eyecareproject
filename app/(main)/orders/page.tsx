import { DataTable } from "@/components/ui/data-table";
import { GetOrdersAction } from "@/lib/actions/orders.action";
import { OrdersColumn } from "./column";
import CustomPagination from "@/components/core/CustomPagination";

export default async function OrdersPage({ searchParams }: {
    searchParams: Promise<{
        page?: number
    }>
}) {
    const params = await searchParams

    const orders = await GetOrdersAction({
        page: 1
    })

    return <>
        <div className="p-3">
            <h2 className="mb-2">سفارش ها</h2>

            <DataTable data={orders.data.orders} columns={OrdersColumn} />
            <CustomPagination
                total={orders.data.total}
                paramKey="page"
            />

        </div >
    </>
}