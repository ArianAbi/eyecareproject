"use client"

import { buttonVariants } from "@/components/ui/button";
import { User } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
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
        accessorKey: "userStatus",
        header: "وضعیت حساب",
        cell: ({ row }) => {
            let text = ""
            let color = ""

            switch (row.original.userStatus) {
                case "VERIFIED":
                    text = "تایید شده"
                    color = "bg-emerald-500/40"
                    break;
                case "REJECTED":
                    text = "رد شده"
                    color = "bg-red-500/40"
                    break;
                case "UNVERIFIED":
                    text = "تایید نشده"
                    color = "bg-gray-500/40"
                    break;
                case "WAITING_FOR_APPROVAL":
                    text = "در انتظار تایید"
                    color = "bg-amber-500/40"
                    break;

                default:
                    break;
            }

            return <span className={cn(
                color,
                "px-2 border rounded-md text-xs"
            )}>
                {
                    text
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
        header: "تاریخ ساخت",
        cell: ({ row }) => {
            return format(row.original.createdAt, "yyyy/MM/dd")
        }
    }
]