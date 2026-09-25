import Link from "next/link"
import { notFound } from "next/navigation"
import { GetTicketsAction, ADMIN_GetTicketsAction, GetSingleTicketAction, ADMIN_GetSingleTicketAction, CloseTicketAction, ADMIN_CloseTicketAction } from "@/lib/actions/tickets.action"
import { TicketForm } from "./TicketForm"
import { ActionButton } from "./ActionButton"
import { QueryFilters } from "./QueryFilters"
import CustomPagination from "./CustomPagination"
import { Badge } from "../ui/badge"
import { ChevronRight } from "lucide-react"
import { buttonVariants } from "../ui/button"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { AdminTicketTabs } from "./AdminTicketTabs"

const date = (value: Date) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(value)

export async function TicketList({ admin = false, filters }: { admin?: boolean, filters: { page?: string, status?: string } }) {
    const status = filters.status === 'CLOSED' ? 'CLOSED' : 'OPEN'
    const { data } = await (admin ? ADMIN_GetTicketsAction : GetTicketsAction)(admin ? { ...filters, status } : filters)
    const tickets = <>
        <div className="divide-y rounded-lg border">{data.tickets.length ? data.tickets.map(ticket => <Link key={ticket.id} href={`${admin ? '/admin' : ''}/tickets/${ticket.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-muted">
            <div className="min-w-0 space-y-2">
                {admin && <div className="flex items-center gap-2">
                    <Avatar><AvatarFallback>{Array.from(ticket.user.username.trim()).slice(0, 2).join('').toLocaleUpperCase()}</AvatarFallback></Avatar>
                    <p className="font-semibold wrap-anywhere">{ticket.user.username}</p>
                </div>}
                <p className="font-medium wrap-anywhere">{ticket.subject}</p>
                <p className="text-xs text-muted-foreground">{date(ticket.updatedAt)} · {ticket._count.messages} پیام</p>
            </div>
            <Badge variant="outline">{ticket.status === 'CLOSED' ? 'بسته' : ticket.messages[0]?.fromAdmin ? 'پاسخ پشتیبانی' : 'در انتظار پشتیبانی'}</Badge>
        </Link>) : <p className="p-8 text-center text-muted-foreground">تیکتی یافت نشد.</p>}</div>
        <CustomPagination total={data.total} paramKey="page" />
    </>
    return <div className="mx-auto max-w-5xl space-y-5 p-3">
        <h1 className="text-xl font-semibold">{admin ? 'مدیریت تیکت‌ها' : 'پشتیبانی و تیکت‌ها'}</h1>
        {admin ? <AdminTicketTabs status={status}>{tickets}</AdminTicketTabs> : <>
            <TicketForm />
            <QueryFilters date={false} statuses={[{ value: 'OPEN', label: 'باز' }, { value: 'CLOSED', label: 'بسته' }]} />
            {tickets}
        </>}
    </div>
}

export async function TicketDetail({ id, admin = false, page }: { id: string, admin?: boolean, page?: string }) {
    const ticket = await (admin ? ADMIN_GetSingleTicketAction : GetSingleTicketAction)(id, page)
    if (!ticket) notFound()
    return <div className="mx-auto max-w-3xl space-y-5 p-4">
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={`${admin ? '/admin' : ''}/tickets`}>
            <ChevronRight />
            <span>
                تیکت ها
            </span>
        </Link>

        <div className="flex flex-col gap-1">
            <ActionButton action={(admin ? ADMIN_CloseTicketAction : CloseTicketAction).bind(null, id)}>
                مشکل حل شد؟
            </ActionButton>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">
                    {ticket.subject}
                </h1>

                <Badge className={`${ticket.status == 'OPEN' ? 'bg-cyan-500/60 border-cyan-500' : 'bg-red-500/30 border-red-500'}
            border-2 text-sm p-2.5 text-white font-semibold`}>
                    {ticket.status === 'OPEN' ? 'باز' : 'بسته'}
                </Badge>

            </div>
        </div>


        <ol className="space-y-3">{[...ticket.messages].reverse().map(message => <li key={message.id} className={`rounded-lg border p-4 ${message.fromAdmin ? 'bg-muted' : 'bg-card'}`}>
            <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{message.fromAdmin ? 'پشتیبانی' : message.author.username}</span><time dateTime={message.createdAt.toISOString()}>{date(message.createdAt)}</time></div>
            <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7">{message.message}</p>
        </li>)}</ol>
        <CustomPagination total={ticket._count.messages} pageSize={50} paramKey="messagesPage" />
        {ticket.status === 'OPEN' ?
            <>
                <TicketForm ticketId={id} admin={admin} />
            </>
            :
            <p className="rounded-lg border p-4 text-sm">این تیکت بسته شده و امکان ارسال پاسخ ندارد.</p>}
    </div>
}
