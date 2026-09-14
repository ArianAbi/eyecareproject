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
import { GetOrdersAction } from "@/lib/actions/orders.action";
import { cn } from "@/lib/utils";
import { ActionData } from "@/types/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { Check, PenIcon, TrashIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

type OrderActionType = ActionData<typeof GetOrdersAction>[0]

export const OrdersColumn: ColumnDef<OrderActionType>[] = [
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