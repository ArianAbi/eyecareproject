"use client"

import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { FormFieldSwitchShorthand } from "@/components/core/FormFieldSwitchShorthand";
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MasterCategory } from "@/generated/prisma/client";
import { ADMIN_DeleteMasterCategorys, ADMIN_UpdateMasterCategorys } from "@/lib/actions/admin.masterCategory.actions";
import { ADMIN_GetOrdersAction } from "@/lib/actions/admin.orders.action";
import { cn } from "@/lib/utils";
import { ActionData } from "@/types/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { Check, PenIcon, TrashIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

type AdminOrderActionType = ActionData<typeof ADMIN_GetOrdersAction>[0]

export const AdminOrdersColumn: ColumnDef<AdminOrderActionType>[] = [
    {
        accessorKey: "user",
        header: "کاربر",
        cell: ({ row }) => {
            return <div>{row.original.user.username}</div>
        }
    },
    {
        accessorKey: "orderItems",
        header: () => <div className="text-center">تعداد سفارش ها</div>,
        cell: ({ row }) => {
            return <div className="text-center">{row.original.orderItems.length}</div>
        }
    },
    {
        accessorKey: "status",
        header: () => <div>
            وضعیت
        </div>,
        cell: ({ row }) => {
            return <div>{
                row.original.status
            }</div>
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