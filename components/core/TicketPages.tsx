import Link from "next/link"
import { notFound } from "next/navigation"
import { GetTicketsAction, ADMIN_GetTicketsAction, GetSingleTicketAction, ADMIN_GetSingleTicketAction, CloseTicketAction, ADMIN_CloseTicketAction } from "@/lib/actions/tickets.action"
import { TicketForm } from "./TicketForm"
import { ActionButton } from "./ActionButton"
import { QueryFilters } from "./QueryFilters"
import CustomPagination from "./CustomPagination"
import { Badge } from "../ui/badge"

const date = (value: Date) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(value)

export async function TicketList({ admin = false, filters }: { admin?: boolean, filters: { page?: string, status?: string } }) {
    const { data } = await (admin ? ADMIN_GetTicketsAction : GetTicketsAction)(filters)
    return <div className="mx-auto max-w-5xl space-y-5 p-3">
        <h1 className="text-xl font-semibold">{admin ? 'مدیریت تیکت‌ها' : 'پشتیبانی و تیکت‌ها'}</h1>
        {!admin && <TicketForm />}
        <QueryFilters date={false} statuses={[{ value: 'OPEN', label: 'باز' }, { value: 'CLOSED', label: 'بسته' }]} />
        <div className="divide-y rounded-lg border">{data.tickets.length ? data.tickets.map(ticket => <Link key={ticket.id} href={`${admin ? '/admin' : ''}/tickets/${ticket.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted">
            <div><p className="font-medium">{ticket.subject}</p><p className="mt-1 text-xs text-muted-foreground">{admin && `${ticket.user.username} · `}{date(ticket.updatedAt)} · {ticket._count.messages} پیام</p></div>
            <Badge variant="outline">{ticket.status === 'CLOSED' ? 'بسته' : ticket.messages[0]?.fromAdmin ? 'پاسخ پشتیبانی' : 'در انتظار پشتیبانی'}</Badge>
        </Link>) : <p className="p-8 text-center text-muted-foreground">تیکتی یافت نشد.</p>}</div>
        <CustomPagination total={data.total} paramKey="page" />
    </div>
}

export async function TicketDetail({ id, admin = false }: { id: string, admin?: boolean }) {
    const ticket = await (admin ? ADMIN_GetSingleTicketAction : GetSingleTicketAction)(id)
    if (!ticket) notFound()
    return <div className="mx-auto max-w-3xl space-y-5 p-4">
        <Link className="text-sm underline" href={`${admin ? '/admin' : ''}/tickets`}>بازگشت به تیکت‌ها</Link>
        <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold">{ticket.subject}</h1><Badge>{ticket.status === 'OPEN' ? 'باز' : 'بسته'}</Badge></div>
        <ol className="space-y-3">{ticket.messages.map(message => <li key={message.id} className={`rounded-lg border p-4 ${message.fromAdmin ? 'bg-muted' : 'bg-card'}`}>
            <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{message.fromAdmin ? 'پشتیبانی' : message.author.username}</span><time dateTime={message.createdAt.toISOString()}>{date(message.createdAt)}</time></div>
            <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.message}</p>
        </li>)}</ol>
        {ticket.status === 'OPEN' ? <><TicketForm ticketId={id} admin={admin} /><ActionButton action={(admin ? ADMIN_CloseTicketAction : CloseTicketAction).bind(null, id)}>بستن تیکت</ActionButton></> : <p className="rounded-lg border p-4 text-sm">این تیکت بسته شده و امکان ارسال پاسخ ندارد.</p>}
    </div>
}
