"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreateTicketAction, ReplyTicketAction, ADMIN_ReplyTicketAction } from "@/lib/actions/tickets.action"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Label } from "../ui/label"

export function TicketForm({ ticketId, admin = false }: { ticketId?: string, admin?: boolean }) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()
    return <form className="space-y-3 rounded-lg border p-4" onSubmit={event => {
        event.preventDefault()
        const form = event.currentTarget
        const data = new FormData(form)
        startTransition(async () => {
            setError('')
            try {
                const message = String(data.get('message') ?? '')
                if (ticketId) await (admin ? ADMIN_ReplyTicketAction : ReplyTicketAction)(ticketId, message)
                else {
                    const result = await CreateTicketAction({ subject: String(data.get('subject') ?? ''), message })
                    router.push(`/tickets/${result.data.id}`)
                }
                form.reset()
                router.refresh()
            } catch { setError('ارسال پیام انجام نشد. متن و وضعیت تیکت را بررسی کنید.') }
        })
    }}>
        {!ticketId && <div className="space-y-2"><Label htmlFor="ticket-subject">موضوع تیکت جدید</Label><Input id="ticket-subject" name="subject" required minLength={3} maxLength={150} /></div>}
        <div className="space-y-2"><Label htmlFor="ticket-message">{ticketId ? 'پاسخ شما' : 'متن پیام'}</Label><Textarea id="ticket-message" name="message" required maxLength={5000} rows={4} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending}>{pending ? 'در حال ارسال…' : 'ارسال پیام'}</Button>
    </form>
}
