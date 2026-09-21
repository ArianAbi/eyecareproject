"use client"

import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { Product, SubCategory, Tags } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { ADMIN_DeleteProductCategorys, ADMIN_UpdateProductCategorys } from "@/lib/actions/admin.productCategory.actions";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { PenIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { colorSelectMap, colorOptionsType } from "@/components/core/FormFieldColorSelectShorthand";

export const AdminTagsColumn: ColumnDef<Tags>[] = [
    {
        accessorKey: "edit",
        header: "",
        cell: ({ row }) => {
            return <div className="space-x-2">
                {/* <ProductCategoryEditBtn data={row.original} /> */}
                Edit
            </div>
        }
    },
    {
        accessorKey: "name",
        header: "نام",
        cell: ({ row }) => {
            return <div className="flex gap-2">
                <div className={cn(colorSelectMap[row.original.color as colorOptionsType["value"]], "size-4 rounded-full")}></div>

                <div>
                    {row.original.name}
                </div>
            </div>
        }
    },
    // {
    //     accessorKey: "products",
    //     header: "محصولات متصل",
    //     cell: ({ row }) => {
    //         return <div>
    //             {row.original.products.length}
    //         </div>
    //     }
    // },
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
    },
    {
        accessorKey: "delete",
        header: "",
        cell: ({ row }) => {
            return <div className="space-x-2">
                Delete
            </div>
        }
    },
]
