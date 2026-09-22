import { GetSingleOrder } from "@/lib/actions/orders.action"
import { notFound } from "next/navigation"
import SingleOrderItem from "./SingleOrderItem"

export default async function SingleOrder({ params }: {
    params: Promise<{
        id: string
    }>
}) {
    const { id } = await params

    const { data } = await GetSingleOrder(id)

    if (!data) notFound()

    return <SingleOrderItem data={data}/>
}
