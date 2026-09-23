import { DataTable } from "@/components/ui/data-table"
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action"
import { AdminOrdersColumn } from "./column"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderFilters } from "@/components/core/OrderFilters"
import CustomPagination from "@/components/core/CustomPagination"
import { selectedUser, orderStatuses, type OrderFilters as Filters } from "@/lib/order-filters"
import { TodaysOrdersSection } from "@/components/core/TodaysOrdersSection"
import { SummaryDayFilter } from "@/components/core/SummaryDayFilter"
import { tehranDay, validDay } from "@/lib/prisma-date-filter"

export default async function AdminOrdersPage({ searchParams }: {
    searchParams: Promise<Filters & { pendingPage?: string, restPage?: string, day?: string }>
}) {
    const params = await searchParams
    const historyDay = validDay(params.day) ? params.day : tehranDay()
    const common = { ...params, userId: selectedUser(params.userId ?? undefined) }
    const selectedStatus = orderStatuses.find(s => s !== 'PENDING' && s === params.status)
    const [pending, rest] = await Promise.all([
        ADMIN_GetOrdersAction({ ...common, status: 'PENDING', page: params.pendingPage }),
        ADMIN_GetOrdersAction({ ...common, status: selectedStatus ?? 'PENDING', excludeStatus: !selectedStatus, page: params.restPage }),
    ])
    return <div className="space-y-4">
        <h1 className="text-xl font-semibold">مدیریت سفارش‌ها</h1>
        <Tabs defaultValue="daily" paramKey="tab">
            <TabsList className="max-w-full flex-wrap h-auto!">
                <TabsTrigger value="daily">مدیریت روز</TabsTrigger>
                <TabsTrigger value="history">تاریخچه سفارش ها</TabsTrigger>
                <TabsTrigger value="submitted">در انتظار تایید ({pending.total})</TabsTrigger><TabsTrigger value="rest">سایر سفارش‌ها ({rest.total})</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="pt-4"><TodaysOrdersSection /></TabsContent>
            <TabsContent value="history" className="space-y-4 pt-4">
                <SummaryDayFilter key={historyDay} day={historyDay} tab="history" />
                <TodaysOrdersSection day={historyDay} />
            </TabsContent>
            <TabsContent value="submitted" className="pt-4"><OrderFilters admin pending /><DataTable data={pending.data} columns={AdminOrdersColumn} /><CustomPagination paramKey="pendingPage" total={pending.total} /></TabsContent>
            <TabsContent value="rest" className="pt-4"><OrderFilters admin /><DataTable data={rest.data} columns={AdminOrdersColumn} /><CustomPagination paramKey="restPage" total={rest.total} /></TabsContent>
        </Tabs>
    </div>
}
