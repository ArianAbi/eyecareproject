import { ADMIN_GetTodayOrdersAction } from "@/lib/actions/admin.today-orders.action"
import { TodaysOrders } from "./TodaysOrders"

export async function TodaysOrdersSection({ day }: { day?: string } = {}) {
    const data = await ADMIN_GetTodayOrdersAction(day)
    return <TodaysOrders key={data.day} {...data} />
}
