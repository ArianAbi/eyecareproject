"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { groupTodayOrders, todayOrderUsers, type TodayOrder } from "@/lib/todays-orders"
import { orderStatuses } from "@/lib/order-filters"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"
import { ADMIN_UpdateOrderStatus } from "@/lib/actions/admin.orders.action"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DailyOrderFee, type DailyFeeReceipt } from "./DailyOrderFee"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDownIcon } from "lucide-react"

const money = (amount: number) => `${amount.toLocaleString("en-US")} تومان`
const statusOptions = orderStatuses.map(value => ({ value, label: OrderStatusFarsi(value).text }))

function Choice({ value, onChange, label, options, disabled = false }: {
    value: string, onChange: (value: string) => void, label: string,
    options: { value: string, label: string }[], disabled?: boolean,
}) {
    return <Select value={value} onValueChange={value => value && onChange(value)} disabled={disabled}>
        <SelectTrigger aria-label={label} className="min-w-40">{options.find(option => option.value === value)?.label ?? label}</SelectTrigger>
        <SelectContent>{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
}

function OrderStatusControl({ order }: { order: TodayOrder }) {
    const [status, setStatus] = useState<string>(order.status)
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState("")
    const router = useRouter()
    return <div className="space-y-1">
        <div className="flex items-center gap-2">
            <Choice value={status} onChange={setStatus} options={statusOptions} label={`وضعیت سفارش ${order.number}`} disabled={pending} />
            <Button type="button" size="sm" disabled={pending || status === order.status} onClick={() => {
                setError("")
                startTransition(async () => {
                    try {
                        await ADMIN_UpdateOrderStatus({ id: order.id, newStatus: status as TodayOrder["status"] })
                        router.refresh()
                    } catch { setError("تغییر وضعیت انجام نشد. دوباره تلاش کنید.") }
                })
            }}>{pending ? "در حال ذخیره…" : "ثبت وضعیت"}</Button>
        </div>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
}

export function TodaysOrders({ day, isToday, orders, deliveryPrice, charges }: { day: string, isToday: boolean, orders: TodayOrder[], deliveryPrice: number, charges: DailyFeeReceipt[] }) {
    const [userId, setUserId] = useState("all")
    const [status, setStatus] = useState("all")
    const [refreshing, startRefresh] = useTransition()
    const router = useRouter()
    const users = todayOrderUsers(orders)
    const groups = groupTodayOrders(orders, userId, status)
    const count = groups.reduce((sum, group) => sum + group.orders.length, 0)
    return <section className="space-y-4 rounded-xl border bg-card p-4" aria-label={isToday ? "سفارش‌های امروز" : "سفارش‌های روز انتخاب‌شده"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">{isToday ? "سفارش‌های امروز به تفکیک کاربر" : "سفارش‌های روز انتخاب‌شده به تفکیک کاربر"}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(`${day}T12:00:00Z`).toLocaleDateString("fa-IR-u-nu-latn", { timeZone: "Asia/Tehran" })} · به وقت تهران · همه وضعیت‌ها</p>
            </div>
            <Button type="button" variant="outline" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>{refreshing ? "در حال بروزرسانی…" : "بروزرسانی"}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Choice value={userId} onChange={setUserId} label="فیلتر کاربر" options={[{ value: "all", label: "همه کاربران این روز" }, ...users.map(user => ({ value: user.id, label: user.storeName ? `${user.username} · ${user.storeName}` : user.username }))]} />
            <Choice value={status} onChange={setStatus} label="فیلتر وضعیت" options={[{ value: "all", label: "همه وضعیت‌ها" }, ...statusOptions]} />
            {(userId !== "all" || status !== "all") && <Button type="button" variant="ghost" onClick={() => { setUserId("all"); setStatus("all") }}>پاک کردن فیلترها</Button>}
            <p className="text-sm text-muted-foreground" role="status">{count.toLocaleString("en-US")} سفارش · {groups.length.toLocaleString("en-US")} کاربر</p>
        </div>
        {!groups.length && <p className="py-8 text-center text-muted-foreground">{orders.length ? "سفارشی با این فیلترها پیدا نشد." : "در این روز سفارشی ثبت نشده است."}</p>}
        {groups.map(group => <Collapsible key={`${day}-${group.user.id}`} defaultOpen={false} className="overflow-hidden rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3">
                <div><Link className="font-semibold hover:underline" href={`/admin/users/${group.user.id}`}>{group.user.username}</Link>
                    {group.user.storeName && <span className="ms-2 text-sm text-muted-foreground">{group.user.storeName}</span>}
                    <p className="mt-1 text-xs">اعتبار فعلی: {money(group.user.credit)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{group.orders.length.toLocaleString("en-US")} سفارش</Badge><span className="text-sm">جمع نمایش‌داده‌شده: {money(group.total)}</span>
                    <CollapsibleTrigger aria-label={`نمایش یا بستن سفارش‌های ${group.user.username}`} className="group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2">
                        جزئیات <ChevronDownIcon className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
                    </CollapsibleTrigger>
                </div>
            </div>
            <CollapsibleContent keepMounted>
            <Table>
                <TableHeader><TableRow><TableHead>سفارش / ساعت</TableHead><TableHead>تعداد</TableHead><TableHead>مبلغ کل</TableHead><TableHead>ارسال ثبت‌شده</TableHead><TableHead>مدیریت وضعیت</TableHead><TableHead>جزئیات</TableHead></TableRow></TableHeader>
                <TableBody>{group.orders.map(order => <TableRow key={order.id}>
                    <TableCell><span>#{order.number}</span><p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString("fa-IR-u-nu-latn", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" })}</p></TableCell>
                    <TableCell>{order.itemCount.toLocaleString("en-US")} ردیف / {order.lensCount.toLocaleString("en-US")} عدسی</TableCell>
                    <TableCell>{money(order.total)}</TableCell><TableCell>{money(order.deliveryPrice)}</TableCell>
                    <TableCell><OrderStatusControl key={`${order.id}-${order.status}`} order={order} /></TableCell>
                    <TableCell><Link className="text-sm underline" href={`/admin/orders/${order.id}`}>مدیریت سفارش</Link>{order.customerNote && <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground" title={order.customerNote}>{order.customerNote}</p>}</TableCell>
                </TableRow>)}</TableBody>
            </Table>
            {isToday ? <DailyOrderFee user={group.user} day={day} deliveryPrice={deliveryPrice} charges={charges.filter(charge => charge.userId === group.user.id)} /> : <div className="space-y-2 border-t p-3 text-sm">
                <p className="text-muted-foreground">کسر هزینه جدید فقط برای سفارش‌های امروز امکان‌پذیر است.</p>
                {charges.filter(charge => charge.userId === group.user.id).map(charge => <p key={charge.id}>{charge.reason} · {money(charge.amount)}</p>)}
            </div>}
            </CollapsibleContent>
        </Collapsible>)}
    </section>
}
