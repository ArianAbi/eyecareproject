import { DataTable } from "@/components/ui/data-table"
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action"
import { AdminOrdersColumn } from "./column"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderFilters } from "@/components/core/OrderFilters"
import CustomPagination from "@/components/core/CustomPagination"
import { selectedUser, orderStatuses, type OrderFilters as Filters } from "@/lib/order-filters"

export default async function AdminOrdersPage({ searchParams }: {
    searchParams: Promise<Filters & { pendingPage?: string, restPage?: string }>
}) {
    const params = await searchParams
    const common = { ...params, userId: selectedUser(params.userId ?? undefined) }
    const selectedStatus = orderStatuses.find(s => s !== 'PENDING' && s === params.status)
    const [pending, rest] = await Promise.all([
        ADMIN_GetOrdersAction({ ...common, status: 'PENDING', page: params.pendingPage }),
        ADMIN_GetOrdersAction({ ...common, status: selectedStatus ?? 'PENDING', excludeStatus: !selectedStatus, page: params.restPage }),
    ])
    return <div className="space-y-4">
        <h1 className="text-xl font-semibold">مدیریت سفارش‌ها</h1>
        <Tabs defaultValue="submitted" paramKey="tab">
            <TabsList><TabsTrigger value="submitted">در انتظار تایید ({pending.total})</TabsTrigger><TabsTrigger value="rest">سایر سفارش‌ها ({rest.total})</TabsTrigger></TabsList>
            <TabsContent value="submitted" className="pt-4"><OrderFilters admin pending /><DataTable data={pending.data} columns={AdminOrdersColumn} /><CustomPagination paramKey="pendingPage" total={pending.total} /></TabsContent>
            <TabsContent value="rest" className="pt-4"><OrderFilters admin /><DataTable data={rest.data} columns={AdminOrdersColumn} /><CustomPagination paramKey="restPage" total={rest.total} /></TabsContent>
        </Tabs>
    </div>
}
