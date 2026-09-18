import Link from "next/link"
import { ADMIN_GetSummaryAction } from "@/lib/actions/admin.summary.action"
import { FinancialSummary } from "@/components/core/FinancialSummary"
import { SummaryDayFilter } from "@/components/core/SummaryDayFilter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"
import { calculateOrderTotal } from "@/lib/order-credit"
import { Badge } from "@/components/ui/badge"
import CustomPagination from "@/components/core/CustomPagination"

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ day?: string, page?: string, tab?: string }> }) {
    const params = await searchParams
    const data = await ADMIN_GetSummaryAction(params.day, params.page)
    return <div className="space-y-5">
        <h1 className="text-xl font-semibold">خلاصه مدیریت</h1>
        <SummaryDayFilter day={data.day} tab={params.tab} />
        <Tabs defaultValue="orders" paramKey="tab"><TabsList><TabsTrigger value="orders">سفارش‌ها</TabsTrigger><TabsTrigger value="financial">مالی</TabsTrigger><TabsTrigger value="tickets">تیکت‌ها</TabsTrigger></TabsList>
            <TabsContent value="orders" className="space-y-4 pt-4">
                <div className="grid gap-3 sm:grid-cols-3">{[['تعداد سفارش', data.total], ['تعداد ردیف', data.itemCount], ['مبلغ سفارش‌ها (تومان)', data.orderTotal]].map(([label, value]) => <div className="rounded-lg border bg-card p-4" key={label}><p className="mb-2 text-sm text-muted-foreground">{label}</p><strong className="text-xl">{Number(value).toLocaleString('fa-IR')}</strong></div>)}</div>
                <div className="flex flex-wrap gap-2">{data.statuses.map(row => <Badge key={row.status} variant="outline">{OrderStatusFarsi(row.status).text}: {row._count}</Badge>)}</div>
                <div className="divide-y rounded-lg border">{data.orders.map(order => <Link href={`/admin/orders/${order.id}`} key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-muted">
                    <div><p className="text-sm font-medium">#{order.orederIdentification} · {order.user.username}</p><p className="mt-1 text-xs text-muted-foreground">{order.orderItems.length} ردیف · {order.orderItems.reduce((sum, item) => sum + (item.odOnly ? 1 : 2), 0)} عدسی{order.customerNote && ` · ${order.customerNote.slice(0, 100)}`}</p></div>
                    <div className="text-sm">{calculateOrderTotal(order).toLocaleString('fa-IR')} تومان · <Badge variant="outline">{OrderStatusFarsi(order.status).text}</Badge></div>
                </Link>)}{!data.total && <p className="p-8 text-center text-muted-foreground">در این روز سفارشی ثبت نشده است.</p>}</div>
                <CustomPagination total={data.total} paramKey="page" pageSize={20} />
            </TabsContent>
            <TabsContent value="financial" className="pt-4"><FinancialSummary day={data.day} /></TabsContent>
            <TabsContent value="tickets" className="space-y-4 pt-4"><p>وضعیت فعلی همه تیکت‌ها</p>{data.tickets.map(row => <Link className="block rounded-lg border p-4" key={row.status} href={`/admin/tickets?status=${row.status}`}>{row.status === 'OPEN' ? 'تیکت‌های باز' : 'تیکت‌های بسته'}: {row._count}</Link>)}{!data.tickets.length && <p>تیکتی ثبت نشده است.</p>}<Link href="/admin/tickets" className="underline">مدیریت تیکت‌ها</Link></TabsContent>
        </Tabs>
    </div>
}
