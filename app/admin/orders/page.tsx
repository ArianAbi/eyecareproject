import { DataTable } from "@/components/ui/data-table";
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action"
import { AdminOrdersColumn } from "./column";

export default async function AdminOrdersPage() {
    const orders = await ADMIN_GetOrdersAction()

    return <>
        <DataTable data={orders.data} columns={AdminOrdersColumn} />
    </>
}