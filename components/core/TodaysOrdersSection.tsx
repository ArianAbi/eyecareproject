import { ADMIN_GetTodayOrdersAction } from "@/lib/actions/admin.today-orders.action"
import { TodaysOrders } from "./TodaysOrders"

export async function TodaysOrdersSection() {
    const data = await ADMIN_GetTodayOrdersAction()
    return <TodaysOrders key={data.day} {...data} />
}
