import Link from "next/link"
import { QueryFilters } from "./QueryFilters"
import { InvoiceStatusFarsi, InvoicePaymentTypeFarsi } from "@/lib/invoice-status-farsi-map"
import { GetInvoicesAction } from "@/lib/actions/invoices.action"
import { ADMIN_GetInvoicesAction } from "@/lib/actions/admin.invoices.action"
import type { InvoiceFilters } from "@/lib/invoice-filters"
import { selectedUser } from "@/lib/order-filters"
import CustomPagination from "./CustomPagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { InvoiceControls } from "./InvoiceControls"
import { Badge } from "../ui/badge"

export async function InvoiceList({ admin = false, filters }: { admin?: boolean, filters: InvoiceFilters }) {
    const { data } = await (admin ? ADMIN_GetInvoicesAction : GetInvoicesAction)({ ...filters, userId: selectedUser(filters.userId) })
    return <div className="space-y-4">
        <QueryFilters admin={admin} payment statuses={(['PENDING', 'WAITING_FOR_APPORVAL', 'PAID', 'CANCELED'] as const).map(value => ({ value, label: InvoiceStatusFarsi(value).text }))} />
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>شماره</TableHead>
                        {admin &&
                            <TableHead>کاربر</TableHead>
                        }
                        <TableHead>مبلغ</TableHead>
                        <TableHead>روش</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>عملیات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.invoices.map(invoice => <TableRow key={invoice.id}>
                        <TableCell>
                            <Link className="underline" href={`${admin ? '/admin' : ''}/invoices/${invoice.id}`}>
                                #{invoice.invoiceNumber}
                            </Link>
                        </TableCell>
                        {admin &&
                            <TableCell>
                                <Link href={`/admin/users/${invoice.userId}`} className="underline">
                                {'user' in invoice ? (invoice.user as { username: string }).username : ''}
                                </Link>
                            </TableCell>
                        }
                        <TableCell>
                            {invoice.amount.toLocaleString() + " "}
                            <span className="text-emerald-500 font-semibold">
                                تومان
                            </span>
                        </TableCell>
                        <TableCell>
                            {InvoicePaymentTypeFarsi(invoice.paymentType)}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {InvoiceStatusFarsi(invoice.status).text}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran' }).format(invoice.createdAt)}
                        </TableCell>
                        <TableCell>
                            {admin &&
                                invoice.status === 'WAITING_FOR_APPORVAL' &&
                                invoice.paymentType === 'CREDIT'
                                ?
                                <InvoiceControls id={invoice.id} admin />
                                :
                                !admin &&
                                    invoice.status === 'PENDING' &&
                                    invoice.paymentType === 'CASH'
                                    ?
                                    <InvoiceControls id={invoice.id} />
                                    :
                                    '—'}
                        </TableCell>
                    </TableRow>
                    )}
                    {!data.total &&
                        <TableRow>
                            <TableCell colSpan={admin ? 7 : 6} className="h-24 text-center text-muted-foreground">
                                صورتحسابی یافت نشد.
                            </TableCell>
                        </TableRow>
                    }
                </TableBody>
            </Table>
        </div>
        <CustomPagination total={data.total} paramKey="page" />
    </div>
}
