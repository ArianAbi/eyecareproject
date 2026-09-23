"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GetInvoicesAction } from "@/lib/actions/invoices.action";
import {
  InvoiceStatusFarsi,
  InvoicePaymentTypeFarsi,
} from "@/lib/invoice-status-farsi-map";
import { ActionData } from "@/types/actions";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns-jalali";
import { EyeIcon } from "lucide-react";
import Link from "next/link";

type InvoiceActionType = ActionData<typeof GetInvoicesAction>["invoices"][0];

export const InvoicesColumn: ColumnDef<InvoiceActionType>[] = [
  {
    accessorKey: "id",
    header: "",
    cell: ({ row }) => {
      return (
        <Link
          className={buttonVariants({ variant: "default", size: "sm" })}
          href={`/invoices/${row.original.id}`}
        >
          <EyeIcon />
        </Link>
      );
    },
  },
  {
    accessorKey: "invoiceNumber",
    header: () => <div className="text-center">شناسه فاکتور</div>,
    cell: ({ row }) => {
      return <div className="text-center">{row.original.invoiceNumber}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-center">مبلغ</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <span>{row.original.amount.toLocaleString() + " "}</span>
          <span className="text-xs text-emerald-500 font-semibold">تومان</span>
        </div>
      );
    },
  },
  {
    accessorKey: "paymentType",
    header: () => <div className="text-center">نوع پرداخت</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          {InvoicePaymentTypeFarsi(row.original.paymentType)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">وضعیت</div>,
    cell: ({ row }) => {
      const { text, bg } = InvoiceStatusFarsi(row.original.status);
      return (
        <div className="flex items-center justify-center">
          <div className={cn(bg, "size-3 rounded-full me-1")}></div>
          <span>{text}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: () => <div className="text-center">مهلت پرداخت</div>,
    cell: ({ row }) => {
      if (!row.original.dueDate)
        return (
          <div className="text-center italic text-muted-foreground">---</div>
        );
      return (
        <div className="text-center">
          {format(row.original.dueDate, "yyyy/MM/dd")}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ صدور",
    cell: ({ row }) => {
      return <div>{format(row.original.createdAt, "yyyy/MM/dd")}</div>;
    },
  },
];
