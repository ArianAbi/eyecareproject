'use client'

import { DataTable } from "@/components/ui/data-table";
import { ADMIN_GetOrdersAction, ADMIN_UpdateOrderStatus } from "@/lib/actions/admin.orders.action";
import { ActionData } from "@/types/actions";
import { AdminOrdersColumn } from "./column";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useState } from "react";
import { OrderItemStatus } from "@/generated/prisma/enums";
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminOrderDataTableWrapper({
    data
}: {
    data: ActionData<typeof ADMIN_GetOrdersAction>
}) {
    const statusList = Object.values(OrderItemStatus)
    const [newStatus, setNewStatus] = useState<OrderItemStatus>('APPROVED')

    const router = useRouter()

    return <DataTable
        data={data}
        columns={AdminOrdersColumn}
        enableRowSelection
        onBulkAction={async (row, newStatus) => {
            await ADMIN_UpdateOrderStatus({
                id: row.id,
                newStatus: newStatus as OrderItemStatus
            })
        }}
        onBulkActionFinish={() => router.refresh()}
        renderBulkAction={({ disabled, trigger }) => (
            <div className="flex items-center justify-center gap-0.5">
                <Select onValueChange={(newValue) => {
                    if (typeof newValue == "string") {
                        setNewStatus(newValue as OrderItemStatus)
                    }
                }} disabled={disabled}>
                    <SelectTrigger className="w-36 text-xs">
                        <div className={cn(OrderStatusFarsi(newStatus).bg, 'size-3 rounded-full')}></div>
                        {OrderStatusFarsi(newStatus).text}
                    </SelectTrigger>
                    <SelectContent>
                        {
                            statusList.map(item => {
                                return <SelectItem key={item} value={item}>
                                    <div className={cn(OrderStatusFarsi(item).bg, 'size-3 rounded-full')}></div>

                                    {OrderStatusFarsi(item).text}
                                </SelectItem>
                            })
                        }
                    </SelectContent>
                </Select>

                <Button className={'text-xs'} size={'xs'} disabled={disabled} onClick={() => {
                    trigger(newStatus)
                }}>
                    اعمال
                </Button>
            </div>
        )}
    />
}