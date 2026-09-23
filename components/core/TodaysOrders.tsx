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

const money = (amount: number) => `${amount.toLocaleString("fa-IR")} تومان`
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

export function TodaysOrders({ day, orders, deliveryPrice, charges }: { day: string, orders: TodayOrder[], deliveryPrice: number, charges: DailyFeeReceipt[] }) {
    const [userId, setUserId] = useState("all")
    const [status, setStatus] = useState("all")
    const [refreshing, startRefresh] = useTransition()
    const router = useRouter()
    const users = todayOrderUsers(orders)
    const groups = groupTodayOrders(orders, userId, status)
    const count = groups.reduce((sum, group) => sum + group.orders.length, 0)
    return <section className="space-y-4 rounded-xl border bg-card p-4" aria-label="سفارش‌های امروز">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">سفارش‌های امروز به تفکیک کاربر</h2>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(`${day}T12:00:00Z`).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" })} · به وقت تهران · همه وضعیت‌ها</p>
            </div>
            <Button type="button" variant="outline" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>{refreshing ? "در حال بروزرسانی…" : "بروزرسانی"}</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Choice value={userId} onChange={setUserId} label="فیلتر کاربر" options={[{ value: "all", label: "همه کاربران امروز" }, ...users.map(user => ({ value: user.id, label: user.storeName ? `${user.username} · ${user.storeName}` : user.username }))]} />
            <Choice value={status} onChange={setStatus} label="فیلتر وضعیت" options={[{ value: "all", label: "همه وضعیت‌ها" }, ...statusOptions]} />
            {(userId !== "all" || status !== "all") && <Button type="button" variant="ghost" onClick={() => { setUserId("all"); setStatus("all") }}>پاک کردن فیلترها</Button>}
            <p className="text-sm text-muted-foreground" role="status">{count.toLocaleString("fa-IR")} سفارش · {groups.length.toLocaleString("fa-IR")} کاربر</p>
        </div>
        {!groups.length && <p className="py-8 text-center text-muted-foreground">{orders.length ? "سفارشی با این فیلترها پیدا نشد." : "امروز هنوز سفارشی ثبت نشده است."}</p>}
        {groups.map(group => <article key={group.user.id} className="overflow-hidden rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3">
                <div><Link className="font-semibold hover:underline" href={`/admin/users/${group.user.id}`}>{group.user.username}</Link>
                    {group.user.storeName && <span className="ms-2 text-sm text-muted-foreground">{group.user.storeName}</span>}
                    <p className="mt-1 text-xs">اعتبار فعلی: {money(group.user.credit)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{group.orders.length.toLocaleString("fa-IR")} سفارش</Badge><span className="text-sm">جمع نمایش‌داده‌شده: {money(group.total)}</span></div>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>سفارش / ساعت</TableHead><TableHead>تعداد</TableHead><TableHead>مبلغ کل</TableHead><TableHead>ارسال ثبت‌شده</TableHead><TableHead>مدیریت وضعیت</TableHead><TableHead>جزئیات</TableHead></TableRow></TableHeader>
                <TableBody>{group.orders.map(order => <TableRow key={order.id}>
                    <TableCell><span>#{order.number}</span><p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" })}</p></TableCell>
                    <TableCell>{order.itemCount.toLocaleString("fa-IR")} ردیف / {order.lensCount.toLocaleString("fa-IR")} عدسی</TableCell>
                    <TableCell>{money(order.total)}</TableCell><TableCell>{money(order.deliveryPrice)}</TableCell>
                    <TableCell><OrderStatusControl key={`${order.id}-${order.status}`} order={order} /></TableCell>
                    <TableCell><Link className="text-sm underline" href={`/admin/orders/${order.id}`}>مدیریت سفارش</Link>{order.customerNote && <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground" title={order.customerNote}>{order.customerNote}</p>}</TableCell>
                </TableRow>)}</TableBody>
            </Table>
            <DailyOrderFee user={group.user} day={day} deliveryPrice={deliveryPrice} charges={charges.filter(charge => charge.userId === group.user.id)} />
        </article>)}
    </section>
}
