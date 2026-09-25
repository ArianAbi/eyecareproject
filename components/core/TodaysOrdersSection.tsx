import CustomPagination from "./CustomPagination"
import { ADMIN_GetTodayOrdersAction } from "@/lib/actions/admin.today-orders.action"
import { TodaysOrders } from "./TodaysOrders"

export async function TodaysOrdersSection({ day, page }: { day?: string; page?: string } = {}) {
    const data = await ADMIN_GetTodayOrdersAction(day, page)
    return <><TodaysOrders key={data.day} {...data} /><p className="text-xs text-muted-foreground">??????? ???? ??????? ???? ???? ????? ???????.</p><CustomPagination total={data.totalUsers} pageSize={20} paramKey="dailyPage" /></>
}
