import { calculateOrderCount } from "@/lib/order-count";
import type { GetSingleOrder } from "@/lib/actions/orders.action"
import type { ActionData } from "@/types/actions"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"
import { calculateOrderTotal } from "@/lib/order-credit"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { OrderTable } from "@/components/OrderTable"
import OrderUpdateHistory from "@/components/OrderUpdateHistory"

export default function SingleOrderItem({ data }: { data: NonNullable<ActionData<typeof GetSingleOrder>> }) {
    const status = OrderStatusFarsi(data.status)
    return <>
        <Link className={buttonVariants({ variant: 'outline' }) + ' mb-2'} href="/orders">
            <ArrowRight /> سفارش‌ها
        </Link>
        <section className="rounded-lg border border-dashed p-3 space-y-2 text-sm">
            <p>شناسه سفارش: {data.orederIdentification}</p>
            <div className="flex items-center gap-2">
                وضعیت: <span className={`${status.bg} size-3 rounded-full`} /> {status.text}
            </div>
            <p>تعداد اقلام: {calculateOrderCount(data.orderItems).toLocaleString()}</p>
            <p>جمع مبلغ: {calculateOrderTotal(data).toLocaleString()} تومان</p>
            {data.customerNote && <p className="whitespace-pre-wrap break-words">یادداشت شما: {data.customerNote}</p>}
        </section>
        <OrderUpdateHistory updates={data.orderUpdate} customerOrderId={data.id} />
        <section className="mt-3 rounded-lg border border-dashed p-3">
            <h2 className="mb-2">اقلام سفارش</h2>
            <div className="overflow-x-auto rounded-lg border"><OrderTable data={data.orderItems} /></div>
        </section>
    </>
}
