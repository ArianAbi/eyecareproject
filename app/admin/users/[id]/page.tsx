import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { ADMIN_GetUserDetailsAction } from "@/lib/actions/admin.users.actions"
import { userStatusLabels } from "@/lib/user-status"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"
import { InvoicePaymentTypeFarsi, InvoiceStatusFarsi } from "@/lib/invoice-status-farsi-map"
import { calculateOrderTotal } from "@/lib/order-credit"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CustomPagination from "@/components/core/CustomPagination"
import { InvoiceControls } from "@/components/core/InvoiceControls"
import { UserControls, UserCreditControls } from "./UserControls"

const date = (value: Date) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(value)
const money = (value: number) => `${value.toLocaleString('fa-IR')} تومان`

function Records({ headings, total, pageKey, children }: { headings: string[], total: number, pageKey: string, children: ReactNode }) {
    return <div className="space-y-3"><div className="rounded-lg border"><Table>
        <TableHeader><TableRow>{headings.map(heading => <TableHead key={heading}>{heading}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{children}{!total && <TableRow><TableCell colSpan={headings.length} className="h-24 text-center text-muted-foreground">موردی ثبت نشده است.</TableCell></TableRow>}</TableBody>
    </Table></div>{total > 0 && <CustomPagination total={total} paramKey={pageKey} />}</div>
}

export default async function SingleUserPage({ params, searchParams }: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ invoicesPage?: string, ticketsPage?: string, ordersPage?: string, cartPage?: string, logsPage?: string }>,
}) {
    const { id } = await params
    const data = await ADMIN_GetUserDetailsAction(id, await searchParams)
    if (!data) notFound()
    const { user } = data
    const info = [
        ['نام کاربری', user.username], ['شماره همراه', user.number], ['نام مدیر', user.managementName],
        ['نام فروشگاه', user.storeName], ['کد ملی', user.nationalCode], ['نقش', user.admin ? 'مدیر' : 'کاربر'],
        ['اعتبار حساب', money(user.credit)], ['تاریخ عضویت', date(user.createdAt)], ['آخرین ویرایش', date(user.updatedAt)],
        ['شناسه کاربر', user.id],
    ]
    return <div className="space-y-4 p-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-semibold">اطلاعات کاربر</h1><Link href="/admin/users" className="text-sm underline">بازگشت به کاربران</Link></div>
        <section className="space-y-4 rounded-lg border-2 border-dashed border-border p-3">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{user.storeName || user.username}</h2><Badge variant="outline" className={user.userStatus === 'VERIFIED' ? 'bg-emerald-500/30' : user.userStatus === 'REJECTED' ? 'bg-red-500/30' : 'bg-amber-500/30'}>{userStatusLabels[user.userStatus]}</Badge></div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">{info.map(([label, value]) => <div key={label} className="space-y-1"><dt className="text-muted-foreground">{label}</dt><dd className="break-words">{value || '—'}</dd></div>)}<div className="space-y-1 sm:col-span-2 xl:col-span-3"><dt className="text-muted-foreground">آدرس</dt><dd className="whitespace-pre-wrap break-words">{user.address || 'آدرس ثبت نشده است'}</dd></div></dl>
        </section>
        <Tabs paramKey="tab" defaultValue="general" className="space-y-3">
            <div className="overflow-x-auto pb-1"><TabsList>
                <TabsTrigger value="general">کنترل‌های عمومی</TabsTrigger>
                <TabsTrigger value="invoices">صورتحساب‌ها ({user._count.invoices.toLocaleString('fa-IR')})</TabsTrigger>
                <TabsTrigger value="tickets">تیکت‌ها {data.openTickets > 0 && <Badge variant="destructive" aria-label={`${data.openTickets} تیکت باز`}>{data.openTickets.toLocaleString('fa-IR')}</Badge>}</TabsTrigger>
                <TabsTrigger value="orders">سفارش‌ها {data.newOrders > 0 && <Badge variant="destructive" aria-label={`${data.newOrders} سفارش جدید`}>{data.newOrders.toLocaleString('fa-IR')}</Badge>}</TabsTrigger>
                <TabsTrigger value="cart">سبد خرید ({data.cartTotal.toLocaleString('fa-IR')})</TabsTrigger>
                <TabsTrigger value="logs">گزارش فعالیت‌ها</TabsTrigger>
            </TabsList></div>
            <TabsContent value="general"><UserControls key={`${user.id}-${user.updatedAt.toISOString()}`} user={user} /></TabsContent>
            <TabsContent value="invoices" className="space-y-4">
                <UserCreditControls user={user} />
                <Records headings={['شماره', 'مبلغ', 'روش پرداخت', 'وضعیت', 'تاریخ ایجاد', 'سررسید', 'تاریخ پرداخت', 'عملیات']} total={user._count.invoices} pageKey="invoicesPage">
                    {data.invoices.map(invoice => <TableRow key={invoice.id}>
                        <TableCell><Link className="underline" href={`/admin/invoices/${invoice.id}`}>#{invoice.invoiceNumber}</Link></TableCell>
                        <TableCell>{money(invoice.amount)}</TableCell><TableCell>{InvoicePaymentTypeFarsi(invoice.paymentType)}</TableCell>
                        <TableCell><Badge variant="outline" className={InvoiceStatusFarsi(invoice.status).bg}>{InvoiceStatusFarsi(invoice.status).text}</Badge></TableCell>
                        <TableCell>{date(invoice.createdAt)}</TableCell><TableCell>{invoice.dueDate ? date(invoice.dueDate) : '—'}</TableCell><TableCell>{invoice.paidAt ? date(invoice.paidAt) : '—'}</TableCell>
                        <TableCell>{invoice.status === 'WAITING_FOR_APPORVAL' && invoice.paymentType === 'CREDIT' ? <InvoiceControls id={invoice.id} admin /> : '—'}</TableCell>
                    </TableRow>)}
                </Records>
            </TabsContent>
            <TabsContent value="tickets"><Records headings={['موضوع', 'وضعیت', 'تعداد پیام‌ها', 'تاریخ ایجاد', 'آخرین بروزرسانی', 'عملیات']} total={user._count.tickets} pageKey="ticketsPage">
                {data.tickets.map(ticket => <TableRow key={ticket.id}><TableCell className="max-w-72 whitespace-normal break-words">{ticket.subject}</TableCell><TableCell><Badge variant={ticket.status === 'OPEN' ? 'destructive' : 'outline'}>{ticket.status === 'OPEN' ? 'باز' : 'بسته'}</Badge></TableCell><TableCell>{ticket._count.messages}</TableCell><TableCell>{date(ticket.createdAt)}</TableCell><TableCell>{date(ticket.updatedAt)}</TableCell><TableCell><Link className="underline" href={`/admin/tickets/${ticket.id}`}>مشاهده و پاسخ</Link></TableCell></TableRow>)}
            </Records></TabsContent>
            <TabsContent value="orders"><Records headings={['شماره سفارش', 'وضعیت', 'تعداد اقلام', 'مبلغ کل', 'هزینه ارسال', 'یادداشت مشتری', 'تاریخ', 'عملیات']} total={user._count.orders} pageKey="ordersPage">
                {data.orders.map(order => <TableRow key={order.id}><TableCell>#{order.orederIdentification}</TableCell><TableCell><Badge variant="outline" className={OrderStatusFarsi(order.status).bg}>{OrderStatusFarsi(order.status).text}</Badge></TableCell><TableCell>{order.orderItems.length}</TableCell><TableCell>{money(calculateOrderTotal(order))}</TableCell><TableCell>{money(order.deliveryPrice)}</TableCell><TableCell className="max-w-60 whitespace-normal break-words">{order.customerNote || '—'}</TableCell><TableCell>{date(order.createdAt)}</TableCell><TableCell><Link className="underline" href={`/admin/orders/${order.id}`}>مشاهده و مدیریت</Link></TableCell></TableRow>)}
            </Records></TabsContent>
            <TabsContent value="cart" className="space-y-3">
                <p className="text-muted-foreground">قیمت‌ها، قیمت فعلی محصول هستند؛ هزینه برش و ارسال هنگام ثبت سفارش محاسبه می‌شود.</p>
                <Records headings={['محصول', 'قیمت محصول', 'چشم راست (SPH / CYL / AXIS)', 'چشم چپ (SPH / CYL / AXIS)', 'نوع', 'تاریخ افزودن']} total={data.cartTotal} pageKey="cartPage">
                    {data.cart.map(item => <TableRow key={item.id}><TableCell><Link className="underline" href={`/admin/products/${item.productId}`}>{item.product.name}</Link>{!item.product.active && <Badge variant="destructive" className="ms-2">غیرفعال</Badge>}</TableCell><TableCell>{money(item.product.price)}</TableCell><TableCell dir="ltr">{item.odSph} / {item.odCyl} / {item.odAux}</TableCell><TableCell dir="ltr">{item.odOnly ? '—' : `${item.osSph} / ${item.osCyl} / ${item.osAux}`}</TableCell><TableCell>{item.rawOrCut === 'RAW' ? 'خام' : 'برش‌خورده'}{item.odOnly ? ' · فقط چشم راست' : ' · دو چشم'}</TableCell><TableCell>{date(item.createdAt)}</TableCell></TableRow>)}
                </Records>
            </TabsContent>
            <TabsContent value="logs"><Records headings={['زمان', 'انجام‌دهنده', 'رویداد', 'رکورد', 'جزئیات']} total={data.logsTotal} pageKey="logsPage">
                {data.logs.map(log => <TableRow key={log.id}><TableCell>{date(log.createdAt)}</TableCell><TableCell>{log.actor?.username ?? 'سیستم / کاربر حذف‌شده'}</TableCell><TableCell dir="ltr">{log.action}</TableCell><TableCell className="max-w-60 whitespace-normal break-all text-xs">{log.entityType} · {log.entityId}</TableCell><TableCell className="max-w-96 whitespace-pre-wrap break-words">{log.detail ?? '—'}</TableCell></TableRow>)}
            </Records></TabsContent>
        </Tabs>
    </div>
}
