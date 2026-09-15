import { ADMIN_GetSingleOrder } from "@/lib/actions/admin.orders.action"
import { notFound } from "next/navigation"
import AdminSingleOrderItem from "./AdminSingleOrderItem"

export default async function AdminSingleOrder({ params }: {
    params: Promise<{
        id: string
    }>
}) {
    const { id } = await params

    const { data } = await ADMIN_GetSingleOrder(id)

    if (!data) notFound()

    return <AdminSingleOrderItem data={data}/>
}