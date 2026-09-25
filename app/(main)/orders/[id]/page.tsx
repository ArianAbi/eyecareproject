import CustomPagination from "@/components/core/CustomPagination"
import { GetSingleOrder } from "@/lib/actions/orders.action"
import { notFound } from "next/navigation"
import SingleOrderItem from "./SingleOrderItem"

export default async function SingleOrder({ params, searchParams }: {
    searchParams: Promise<{ itemsPage?: string; updatesPage?: string }>
    params: Promise<{
        id: string
    }>
}) {
    const { id } = await params

    const { data } = await GetSingleOrder(id, await searchParams)

    if (!data) notFound()

    return <><SingleOrderItem data={data}/><p>???? ?????</p><CustomPagination total={data._count.orderItems} pageSize={50} paramKey="itemsPage" /><p>???? ???????</p><CustomPagination total={data._count.orderUpdate} pageSize={50} paramKey="updatesPage" /></>
}
