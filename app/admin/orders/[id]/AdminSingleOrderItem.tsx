'use client'

import { ADMIN_GetSingleOrder } from "@/lib/actions/admin.orders.action";
import { ActionData } from "@/types/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderItemStatus } from "@/generated/prisma/enums"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckIcon, XIcon } from "lucide-react";
import { colorOptionsType, colorSelectMap } from "@/components/core/FormFieldColorSelectShorthand";

export default function AdminSingleOrderItem({ data }: { data: NonNullable<ActionData<typeof ADMIN_GetSingleOrder>> }) {

    const statusValues = Object.values(OrderItemStatus)
    const [selectedStatus, setSelectedStatus] = useState<OrderItemStatus>('APPROVED')

    return <>
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
            </section>

        </section >

        <section className="border mt-2 rounded-lg overflow-hidden border-dashed p-3">
            <h2 className="mb-2">لیست سفارش ها</h2>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>نام محصول</TableHead>
                            <TableHead className="text-center">دسته بندی</TableHead>
                            <TableHead>تک چشم</TableHead>
                            <TableHead>آکس</TableHead>
                            <TableHead>نمره</TableHead>
                            <TableHead>تراش</TableHead>
                            <TableHead>قیمت</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.orderItems.map(item => {
                            return <TableRow>
                                <TableCell>
                                    {item.product.name}
                                </TableCell>

                                <TableCell>
                                    <div className="text-center flex items-center justify-center gap-1">
                                        <div className={cn(
                                            colorSelectMap[item.product.categoryRel.color as colorOptionsType['value']],
                                            'size-3 rounded-full'
                                        )}></div>
                                        {item.product.categoryRel.name}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    {item.odOnly
                                        ?
                                        <CheckIcon className="stroke-emerald-500" stroke="inherit" />
                                        :
                                        <XIcon className="stroke-red-500" stroke="inherit" />
                                    }
                                </TableCell>

                                <TableCell>
                                    {/* AUX */}
                                    <div className="flex flex-col items-start">
                                        <span style={{ direction: "ltr" }}>
                                            <span>OD : </span>
                                            {parseFloat(item.odCyl) < 0 ?
                                                <span>
                                                    {item.odAux} deg
                                                </span>
                                                :
                                                <span>
                                                    ندارد
                                                </span>
                                            }
                                        </span>

                                        {!item.odOnly &&
                                            <span style={{ direction: "ltr" }}>
                                                <span>OS : </span>

                                                {parseFloat(item.osCyl) < 0 ?
                                                    <span>
                                                        {item.osAux} deg
                                                    </span>
                                                    :
                                                    <span>
                                                        ندارد
                                                    </span>
                                                }
                                            </span>
                                        }
                                    </div>
                                </TableCell>

                                <TableCell>
                                    {/* sph & cyl */}
                                    <div className="flex flex-col">
                                        <span>
                                            <span>OD : </span>
                                            <span>{item.odSph}</span>
                                            <span> {item.odCyl}</span>
                                        </span>

                                        {
                                            !item.odOnly &&
                                            <span>
                                                <span>OS : </span>
                                                <span>{item.osSph}</span>
                                                <span> {item.osCyl}</span>
                                            </span>
                                        }
                                    </div>
                                </TableCell>

                                <TableCell>
                                    {
                                        item.rawOrCut == 'RAW'
                                            ?
                                            <span>ندارد</span>
                                            :
                                            <span className="text-emerald-500">دارد</span>
                                    }
                                </TableCell>

                                <TableCell>
                                    {item.purchasedPrice.toLocaleString() + " "}
                                    <span className="text-xs text-emerald-500 font-semibold">
                                        تومان
                                    </span>
                                </TableCell>
                            </TableRow>
                        })
                        }
                    </TableBody>
                </Table>
            </div>
        </section>
    </>
}