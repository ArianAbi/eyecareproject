import CustomPagination from "@/components/core/CustomPagination"
import { ADMIN_GetSingleOrder } from "@/lib/actions/admin.orders.action"
import { notFound } from "next/navigation"
import AdminSingleOrderItem from "./AdminSingleOrderItem"

export default async function AdminSingleOrder({ params, searchParams }: {
    searchParams: Promise<{ itemsPage?: string; updatesPage?: string }>
    params: Promise<{
        id: string
    }>
}) {
    const { id } = await params

    const { data } = await ADMIN_GetSingleOrder(id, await searchParams)

    if (!data) notFound()

    return <><AdminSingleOrderItem data={data}/><p>???? ?????</p><CustomPagination total={data._count.orderItems} pageSize={50} paramKey="itemsPage" /><p>???? ???????</p><CustomPagination total={data._count.orderUpdate} pageSize={50} paramKey="updatesPage" /></>
}