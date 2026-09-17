'use client'

import { ADMIN_GetSingleOrder, ADMIN_UpdateOrderStatus } from "@/lib/actions/admin.orders.action";
import { ActionData } from "@/types/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function SingleOrderItem({ data }: { data: NonNullable<ActionData<typeof ADMIN_GetSingleOrder>> }) {

    const statusValues = Object.values(OrderItemStatus)
    const [selectedStatus, setSelectedStatus] = useState<OrderItemStatus>('APPROVED')

    const [loading, setLoading] = useState(false)

    const updateDisabled = selectedStatus === data.status

    const router = useRouter()

    async function UpdateOrderStatus() {
        try{
            setLoading(true)

            await ADMIN_UpdateOrderStatus({
                id:data.id,
                newStatus:selectedStatus
            })

            toast.add({
                type:"Success",
                title:"وضعیت سفارش بروزرسانی شد"
            })

            router.push('/admin/orders')
        }catch(err){
            if(err instanceof Error){
                toast.add({
                    type:"Error",
                    title:err.message
                })
            }
            toast.add({
                type:"Error",
                title:"updating status failed:Unknown"
            })
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
        <section className="border flex justify-between rounded-lg border-dashed p-3">
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
                        {data.orderItems.reduce((acc, current) => {
                            return acc + current.purchasedPrice
                        }, 0).toLocaleString() + " "}
                        <span className="text-emerald-500 font-semibold">تومان</span>
                    </span>
                </div>
            </section>

            {/* left items */}
            <section className="flex flex-col gap-2 text-sm">
                {/* STATUS */}
                <div className="flex items-center gap-1 mt-auto">
                    <span>وضعیت جدید : </span>
                    <span>
                        <Select
                            defaultValue={'APPROVED' as OrderItemStatus}
                            value={selectedStatus}
                            onValueChange={value => setSelectedStatus(value ?? data.status)}
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