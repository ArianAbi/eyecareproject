import { OrderFilters } from "@/components/core/OrderFilters"
import type { OrderFilters as Filters } from "@/lib/order-filters"
import { DataTable } from "@/components/ui/data-table";
import { GetOrdersAction } from "@/lib/actions/orders.action";
import { OrdersColumn } from "./column";
import CustomPagination from "@/components/core/CustomPagination";

export default async function OrdersPage({ searchParams }: {
    searchParams: Promise<Filters>
}) {
    const params = await searchParams

    const orders = await GetOrdersAction({
        ...params
    })

    return <>
        <div className="p-3">
            <h2 className="mb-2">سفارش ها</h2>

            <OrderFilters />
            <DataTable data={orders.data.orders} columns={OrdersColumn} />
            <CustomPagination
                total={orders.data.total}
                paramKey="page"
            />

        </div >
    </>
}