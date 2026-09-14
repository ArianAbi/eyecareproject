import { DataTable } from "@/components/ui/data-table";
import { GetOrdersAction } from "@/lib/actions/orders.action";
import { OrdersColumn } from "./column";

export default async function OrdersPage() {
    const orders = await GetOrdersAction()

    return <>
        <DataTable data={orders.data} columns={OrdersColumn} />
    </>
}