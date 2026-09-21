"use client"

import { calculateOrderTotal } from "@/lib/order-credit"

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GetOrdersAction } from "@/lib/actions/orders.action";
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map";
import { cn } from "@/lib/utils";
import { ActionData } from "@/types/actions";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { EyeIcon, } from "lucide-react";
import Link from "next/link";

type OrderActionType = ActionData<typeof GetOrdersAction>['orders'][0]

export const OrdersColumn: ColumnDef<OrderActionType>[] = [
    {
        accessorKey: "id",
        header: "",
        cell: ({ row }) => {
            return <Link
                className={buttonVariants({ variant: 'default', size: 'sm' })}
                href={`/orders/${row.original.id}`}>
                <EyeIcon />
            </Link>
        }
    },
    {
        accessorKey: "total-price",
        header: () => <div className="text-center">مبلغ سفارش</div>,
        cell: ({ row }) => {
            const total = calculateOrderTotal(row.original)

            return <div className="text-center">
                <span>
                    {
                        total.toLocaleString() + " "
                    }
                </span>
                <span className="text-xs text-emerald-500 font-semibold">
                    تومان
                </span>
            </div>
        }
    },
    // {
    //     accessorKey: "orderItems",
    //     header: () => <div className="text-center">تعداد سفارش ها</div>,
    //     cell: ({ row }) => {
    //         return <div className="text-center">{row.original._count.orderItems}</div>
    //     }
    // },
    {
        accessorKey: "status",
        header: () => <div className="text-center">
            وضعیت
        </div>,
        cell: ({ row }) => {
            const { text, bg } = OrderStatusFarsi(row.original.status)
            return <div className="flex items-center justify-center">
                <div className={cn(bg, 'size-3 rounded-full me-1')}></div>
                <span>{text}</span>
            </div>
        }
    },
    {
        accessorKey: "customerNote",
        header: () => <div>
            یاداشت شما
        </div>,
        cell: ({ row }) => {
            if (!row.original.customerNote) return <div className="px-4 italic">
                یاداشتی ندارید
            </div>

            return <Dialog>
                <DialogTrigger className={buttonVariants({ variant: 'default' })}>
                    یاداشت مشتری
                </DialogTrigger>

                <DialogContent>
                    <ScrollArea className="max-h-40 mt-4">
                        {row.original.customerNote}
                    </ScrollArea>

                    <Button variant={'default'}>بستن</Button>
                </DialogContent>
            </Dialog>
        }
    },
    {
        accessorKey: "orederIdentification",
        header: () => <div className="text-center">شناسه</div>,
        cell: ({ row }) => {
            return <div className="text-center">
                {
                    row.original.orederIdentification
                }
            </div>
        }
    },

    {
        accessorKey: "createdAt",
        header: "تاریخ ساخت",
        cell: ({ row }) => {
            return <div>
                {
                    format(row.original.createdAt, "yyyy/MM/dd")
                }
            </div>
        }
    }
]