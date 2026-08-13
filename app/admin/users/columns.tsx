"use client"

import { buttonVariants } from "@/components/ui/button";
import { User } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { Check, EyeIcon, XIcon } from "lucide-react";
import Link from "next/link";

export const AdminUserColumns: ColumnDef<Omit<User, "password" | "updatedAt">>[] = [
    {
        accessorKey: "id",
        header: "مشاهده",
        cell: ({ row }) => {
            return <Link className={buttonVariants({ variant: "default" })} href={`/admin/users/${row.original.id}`}>
                <EyeIcon />
            </Link>
        }
    },
    {
        accessorKey: "username",
        header: "نام کاربری"
    },
    {
        accessorKey: "number",
        header: "شماره"
    },
    {
        accessorKey: "admin",
        header: "ادمین",
        cell: ({ row }) => {
            return <span className={row.original.admin ? "stroke-emerald-500" : "stroke-red-500"}>
                {
                    row.original.admin
                        ?
                        <Check stroke="inherit" />
                        :
                        <XIcon stroke="inherit" />
                }
            </span>
        }
    },
    {
        accessorKey: "credit",
        header: "اعتبار حساب",
        cell: ({ row }) => {
            return <div className="space-x-2">
                <span>{row.original.credit ? row.original.credit.toLocaleString() : 0}</span>
                <span className="text-emerald-500 font-semibold">تومان</span>
            </div>
        }
    },
    {
        accessorKey: "createdAt",
        header: "تاریخ ساخت اکانت",
        cell: ({ row }) => {
            return format(row.original.createdAt, "yyyy/MM/dd")
        }
    }
]