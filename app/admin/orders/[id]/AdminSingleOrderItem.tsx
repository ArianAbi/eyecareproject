'use client'

import { ADMIN_GetSingleOrder, ADMIN_UpdateOrderStatus } from "@/lib/actions/admin.orders.action";
import { ActionData } from "@/types/actions";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { OrderItemStatus } from "@/generated/prisma/enums"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { OrderTable } from "@/components/OrderTable";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import OrderUpdateHistory from "@/components/OrderUpdateHistory";
import { calculateOrderTotal } from "@/lib/order-credit";

export default function AdminSingleOrderItem({ data }: { data: NonNullable<ActionData<typeof ADMIN_GetSingleOrder>> }) {

    const statusValues = Object.values(OrderItemStatus)
    const [selectedStatus, setSelectedStatus] = useState<OrderItemStatus>(data.status)
    const [message, setMessage] = useState('')
    const [adminOnly, setAdminOnly] = useState(false)
    const [refundCredit, setRefundCredit] = useState(false)

    const [loading, setLoading] = useState(false)

    const canRefund = selectedStatus === 'ONHOLD' && data.creditCharged > 0 && !data.creditRefundedAt
    const updateDisabled = selectedStatus === data.status && !message.trim() && !(canRefund && refundCredit)

    const router = useRouter()

    async function UpdateOrderStatus() {
        try {
            setLoading(true)

            await ADMIN_UpdateOrderStatus({
                id: data.id,
                newStatus: selectedStatus === data.status ? undefined : selectedStatus,
                message,
                adminOnly,
                refundCredit: canRefund && refundCredit,
            })

            toast.add({
                type: "Success",
                title: "وضعیت سفارش بروزرسانی شد"
            })

            setMessage('')
            setRefundCredit(false)
            router.refresh()
        } catch (err) {
            if (err instanceof Error) {
                toast.add({
                    type: "Error",
                    title: err.message
                })
            } else toast.add({
                type: "Error",
                title: "updating status failed:Unknown"
            })
        } finally {
            setLoading(false)
        }
    }

    return <>
        <Link
            className={buttonVariants({ variant: 'outline' }) + ' mb-2'}
            href={`/admin/orders`}
        >
            <ArrowRight />
            <span>
                سفارش ها
            </span>
        </Link>
        <section className="border flex flex-col gap-4 md:flex-row md:justify-between rounded-lg border-dashed p-3">
            {/* right items */}
            <section className="space-y-2 text-sm">
                <div className="flex gap-1">
                    <span>کاربر : </span>
                    <span>
                        <Link className="underline" href={`/admin/users/${data.userId}`}>
                            {data.user.username}
                        </Link>
                    </span>
                </div>

                <div className="flex gap-1">
                    <span>شناسه سفارش : </span>
                    <span>
                        {data.orederIdentification}
                    </span>
                </div>

                {/* STATUS */}
                <div className="flex items-center gap-1">
                    <span>وضعیت : </span>
                    <span className="flex items-center gap-1">
                        <div className={cn(OrderStatusFarsi(data.status).bg, 'size-3 rounded-full')}></div>
                        {OrderStatusFarsi(data.status).text}
                    </span>
                </div>

                {/* ORDER COUNT */}
                <div className="flex items-center gap-1">
                    <span>تعداد سفارش : </span>
                    <span className="flex items-center gap-1">
                        {data.orderItems.length}
                    </span>
                </div>

                {/* ORDER TOTAL PRICE */}
                <div className="flex items-center gap-1">
                    <span>جمع مبلغ : </span>
                    <span className="flex items-center gap-1">
                        {calculateOrderTotal(data).toLocaleString() + " "}
                        <span className="text-emerald-500 font-semibold">تومان</span>
                    </span>
                </div>
            </section>

            {/* left items */}
            <section className="flex flex-col gap-3 text-sm md:w-1/2">
                {/* STATUS */}
                <div className="flex items-center gap-1 mt-auto">
                    <span>وضعیت جدید : </span>
                    <span>
                        <Select
                            disabled={loading}
                            value={selectedStatus}
                            onValueChange={value => {
                                setSelectedStatus(value ?? data.status)
                                setRefundCredit(false)
                            }}
                        >
                            <SelectTrigger>
                                <div className={cn(OrderStatusFarsi(selectedStatus).bg, 'size-3 rounded-full')}></div>
                                {OrderStatusFarsi(selectedStatus).text}
                            </SelectTrigger>

                            <SelectContent>
                                {
                                    statusValues.map(item => {
                                        return <SelectItem key={item} value={item}>
                                            <div className={cn(OrderStatusFarsi(item).bg, 'size-3 rounded-full')}></div>

                                            {OrderStatusFarsi(item).text}
                                        </SelectItem>
                                    })
                                }
                            </SelectContent>
                        </Select>
                    </span>
                </div>

                <label htmlFor="order-update-message">پیام بروزرسانی (اختیاری هنگام تغییر وضعیت)</label>
                <Textarea id="order-update-message" value={message} maxLength={2000} disabled={loading}
                    onChange={event => setMessage(event.target.value)} placeholder="توضیحات یا دلیل تغییر وضعیت" />
                <label className="flex items-center gap-2">
                    <Checkbox checked={adminOnly} onCheckedChange={setAdminOnly} disabled={loading} />
                    فقط مدیران (Admin Only)
                </label>
                <p className="text-xs text-muted-foreground">این گزینه فقط همین بروزرسانی را مخفی می‌کند؛ وضعیت فعلی سفارش برای کاربر قابل مشاهده است.</p>
                {selectedStatus === 'ONHOLD' && <label className="flex items-center gap-2">
                    <Checkbox checked={canRefund && refundCredit} onCheckedChange={setRefundCredit} disabled={loading || !canRefund} />
                    بازگرداندن اعتبار ({data.creditCharged.toLocaleString()} تومان)
                </label>}
                {data.creditRefundedAt && <p className="text-sm text-emerald-600">اعتبار این سفارش قبلاً بازگردانده شده است.</p>}
                {selectedStatus === 'ONHOLD' && data.creditCharged === 0 && <p className="text-xs text-muted-foreground">برای این سفارش کسر اعتبار ثبت نشده است.</p>}
                <Button
                    onClick={UpdateOrderStatus}
                    disabled={updateDisabled || loading}
                    variant={'green'}
                >
                    <span>
                        بروزرسانی
                    </span>
                    {loading && <Spinner />}
                </Button>
            </section>

        </section >

        <OrderUpdateHistory updates={data.orderUpdate} />

        <section className="border mt-2 rounded-lg overflow-hidden border-dashed p-3">
            <h2 className="mb-2">لیست سفارش ها</h2>

            <div className="border rounded-lg">
                <OrderTable
                    data={data.orderItems}
                />
            </div>
        </section>
    </>
}
