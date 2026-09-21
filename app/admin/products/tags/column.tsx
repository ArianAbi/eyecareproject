"use client"

import { Tags } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { colorSelectMap, colorOptionsType } from "@/components/core/FormFieldColorSelectShorthand";

export const AdminTagsColumn: ColumnDef<Tags>[] = [
    {
        accessorKey: "edit",
        header: "",
        cell: () => {
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
        cell: () => {
            return <div className="space-x-2">
                Delete
            </div>
        }
    },
]
