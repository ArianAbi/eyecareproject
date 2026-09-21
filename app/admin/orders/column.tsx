"use client"


import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action";
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map";
import { cn } from "@/lib/utils";
import { ActionData } from "@/types/actions";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { Check, CheckIcon, EyeIcon, XIcon } from "lucide-react";
import Link from "next/link";

type AdminOrderActionType = ActionData<typeof ADMIN_GetOrdersAction>[0]

export const AdminOrdersColumn: ColumnDef<AdminOrderActionType>[] = [
    {
        id: "select",
        header: ({ table }) => {
            const meta = table.options.meta
            if (meta?.isBulkActionPending) {
                return <Spinner className="size-4" />
            }
            return (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    indeterminate={
                        table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="انتخاب همه"
                />
            )
        },
        cell: ({ row, table }) => {
            const meta = table.options.meta
            const status = meta?.getRowStatus(row.id) ?? "idle"

            if (status === "pending") return <Spinner className="size-4" />
            if (status === "success") return <CheckIcon className="size-4 text-emerald-500" />
            if (status === "error") return <XIcon className="size-4 text-destructive" />

            return (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    disabled={meta?.isBulkActionPending}
                    aria-label="انتخاب ردیف"
                />
            )
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: "",
        cell: ({ row }) => {
            return <Link
                className={buttonVariants({ variant: 'default', size: 'sm' })}
                href={`/admin/orders/${row.original.id}`}>
                <EyeIcon />
            </Link>
        }
    },
    {
        accessorKey: "user",
        header: "کاربر",
        cell: ({ row }) => {
            return <Link
                className="underline"
                href={`/admin/users/${row.original.userId}`}>
                {row.original.user.username}
            </Link>
        }
    },
    {
        accessorKey: "orderItems",
        header: () => <div className="text-center">تعداد سفارش ها</div>,
        cell: ({ row }) => {
            return <div className="text-center">{row.original._count.orderItems}</div>
        }
    },
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
            یاداشت مشتری
        </div>,
        cell: ({ row }) => {
            if (!row.original.customerNote) return <div className="px-4 italic">
                یاداشت ندارد
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