import Link from "next/link"
import type { CreditTransaction } from "@/generated/prisma/client"
import CustomPagination from "./CustomPagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const date = (value: Date) => new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" }).format(value)
const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value)

export function CreditLedger({ rows, total, pageKey = "page", admin = false, printHref }: { rows: CreditTransaction[], total: number, pageKey?: string, admin?: boolean, printHref: string }) {
  return <div className="space-y-3">
    <div className="flex justify-end"><a href={printHref} download="account-statement.pdf" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent">پرینت معین حساب</a></div>
    <div className="overflow-x-auto rounded-lg border"><Table>
      <TableHeader><TableRow><TableHead>تاریخ</TableHead><TableHead>شرح</TableHead><TableHead>تغییر اعتبار</TableHead><TableHead>مانده پس از تراکنش</TableHead><TableHead>مرتبط با</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={row.id}>
        <TableCell className="whitespace-nowrap">{date(row.createdAt)}</TableCell>
        <TableCell className="min-w-40 whitespace-normal break-words">{row.description}</TableCell>
        <TableCell dir="ltr" className={`text-end font-medium ${row.amount > 0 ? "text-emerald-500" : "text-red-500"}`}>{row.amount > 0 ? "+" : "−"}{money(Math.abs(row.amount))} تومان</TableCell>
        <TableCell className="whitespace-nowrap">{row.balanceAfter === null ? "نامشخص" : `${money(row.balanceAfter)} تومان`}</TableCell>
        <TableCell>{row.referenceId && row.type === "INVOICE" ? <Link className="underline" href={`${admin ? "/admin" : ""}/invoices/${row.referenceId}`}>صورتحساب</Link> : row.referenceId && ["ORDER", "REFUND"].includes(row.type) ? <Link className="underline" href={`${admin ? "/admin" : ""}/orders/${row.referenceId}`}>سفارش</Link> : "—"}</TableCell>
      </TableRow>)}{!total && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">تراکنشی ثبت نشده است.</TableCell></TableRow>}</TableBody>
    </Table></div>
    {total > 0 && <CustomPagination total={total} paramKey={pageKey} />}
  </div>
}
