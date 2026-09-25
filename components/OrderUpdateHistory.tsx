"use client"

import { unwrapActionResult } from "@/lib/action-result";
import { useEffect, useState } from "react"
import type { OrderUpdate } from "@/generated/prisma/client"
import { MarkOrderUpdatesRead } from "@/lib/actions/orders.action"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"
import { format } from "date-fns-jalali"
import { Button } from "@/components/ui/button"

export default function OrderUpdateHistory({ updates, customerOrderId }: {
    updates: OrderUpdate[], customerOrderId?: string
}) {
    const unreadIds = updates.filter(update => !update.adminOnly && !update.readAt).map(update => update.id)
    const unreadKey = JSON.stringify(unreadIds)
    const [readError, setReadError] = useState(false)
    const [retry, setRetry] = useState(0)

    useEffect(() => {
        const ids: string[] = JSON.parse(unreadKey)
        if (!customerOrderId || !ids.length) return
        async function acknowledge() {
            try {
                for (let offset = 0; offset < ids.length; offset += 500) {
                    unwrapActionResult(await MarkOrderUpdatesRead({ orderId: customerOrderId!, updateIds: ids.slice(offset, offset + 500) }))
                }
                setReadError(false)
            } catch {
                setReadError(true)
            }
        }
        void acknowledge()
    }, [customerOrderId, unreadKey, retry])

    return <section className="mt-4 rounded-lg border border-dashed p-3 space-y-3">
        <div className="flex items-center gap-2">
            <h2>بروزرسانی‌های سفارش</h2>
            {customerOrderId && unreadIds.length > 0 && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                {unreadIds.length.toLocaleString()} بروزرسانی جدید
            </span>}
        </div>
        {readError && <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
            ثبت مشاهده بروزرسانی‌ها انجام نشد.
            <Button size="sm" variant="outline" onClick={() => setRetry(value => value + 1)}>تلاش مجدد</Button>
        </div>}
        {!updates.length && <p className="text-sm text-muted-foreground">هنوز بروزرسانی ثبت نشده است.</p>}
        <ol className="space-y-3">
            {updates.map(update => {
                const status = OrderStatusFarsi(update.updatedStatus)
                return <li key={update.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className={`${status.bg} size-3 rounded-full`} />
                        <span>{status.text}</span>
                        <time dateTime={new Date(update.createdAt).toISOString()} className="text-xs text-muted-foreground">
                            {format(update.createdAt, "yyyy/MM/dd HH:mm")}
                        </time>
                        {update.adminOnly && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900">فقط مدیران</span>}
                        {customerOrderId && !update.readAt && <span className="text-xs text-blue-600">جدید</span>}
                    </div>
                    {update.message && <p className="whitespace-pre-wrap break-words text-sm">{update.message}</p>}
                    {update.creditRefunded > 0 && <p className="text-sm text-emerald-600">
                        اعتبار بازگردانده‌شده: {update.creditRefunded.toLocaleString()} تومان
                    </p>}
                </li>
            })}
        </ol>
    </section>
}
