"use client"

import { unwrapActionResult } from "@/lib/action-result";
import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { CreateTicketAction, ReplyTicketAction, ADMIN_ReplyTicketAction } from "@/lib/actions/tickets.action"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Button, buttonVariants } from "../ui/button"
import { Label } from "../ui/label"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { Spinner } from "../ui/spinner"
import TextError from "../TextError"

export function TicketForm({ ticketId, admin = false }: { ticketId?: string, admin?: boolean }) {
    const [open, setOpen] = useState(false)

    const [pending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (pending) return
        const form = event.currentTarget
        const data = new FormData(form)
        const message = String(data.get('message') ?? '').trim()
        if (!message) {
            setError('متن پیام را وارد کنید.')
            return
        }
        startTransition(async () => {
            setError('')
            try {
                if (ticketId) unwrapActionResult(await (admin ? ADMIN_ReplyTicketAction : ReplyTicketAction)(ticketId, message))
                else {
                    const result = unwrapActionResult(await CreateTicketAction({ subject: String(data.get('subject') ?? ''), message }))
                    router.push(`/tickets/${result.data.id}`)
                }
                form.reset()
                router.refresh()
            } catch { setError('ارسال پیام انجام نشد. متن و وضعیت تیکت را بررسی کنید.') }
        })
    }

    if (ticketId) return <form className="min-h-10 w-full space-y-2" onSubmit={handleSubmit} aria-busy={pending}>
        <Label htmlFor="ticket-reply">پیام جدید</Label>
        <Textarea id="ticket-reply" name="message" required maxLength={5000} rows={4} disabled={pending} />
        {error && <div role="alert"><TextError>{error}</TextError></div>}
        <Button type="submit" variant="green" disabled={pending}>
            {pending ? 'در حال ارسال' : 'ارسال'}
            {pending && <Spinner />}
        </Button>
    </form>

    return <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger className={buttonVariants({ variant: "default" })}>
            تیکت جدید
        </AlertDialogTrigger>

        <AlertDialogContent className={'gap-1'}>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    تیکت جدید
                </AlertDialogTitle>
            </AlertDialogHeader>

            <div className="border-t"></div>

            <form className="space-y-3 rounded-lg p-4" onSubmit={handleSubmit}>

                {!ticketId &&
                    <div className="space-y-2">
                        <Label htmlFor="ticket-subject">
                            موضوع تیکت جدید
                        </Label>
                        <Input id="ticket-subject" name="subject" required minLength={3} maxLength={150} />
                    </div>
                }
                <div className="space-y-2">
                    <Label htmlFor="ticket-message">
                        {ticketId ? 'پاسخ شما' : 'متن پیام'}
                    </Label>
                    <Textarea id="ticket-message" name="message" required maxLength={5000} rows={4} />
                </div>
                {error &&
                    <TextError>
                        {error}
                    </TextError>
                }


                <div className="space-x-2 mt-3">
                    <Button type="submit" disabled={pending}>
                        <span>ثبت تیکت</span>
                        {pending && <Spinner />}
                    </Button>

                    <AlertDialogCancel variant={'outline'}>
                        لغو
                    </AlertDialogCancel>
                </div>
            </form>
        </AlertDialogContent>
    </AlertDialog>


}
