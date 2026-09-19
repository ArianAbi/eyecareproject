"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreateTicketAction, ReplyTicketAction, ADMIN_ReplyTicketAction } from "@/lib/actions/tickets.action"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Button, buttonVariants } from "../ui/button"
import { Label } from "../ui/label"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { Spinner } from "../ui/spinner"

export function TicketForm({ ticketId, admin = false }: { ticketId?: string, admin?: boolean }) {
    const [open, setOpen] = useState(false)

    const [pending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()

    if(ticketId) return <>
    {/* <div className="fixed bottom-2 left-1/2 -translate-x-1/2 min-h-10 max-w-4xl w-full">
        <Textarea className="border" placeholder="GGG"/>
    </div> */}
    <div className="min-h-10 w-full">
        <h2>پیام جدید</h2>

        <Textarea className="mt-2" />
        <Button className={'mt-2'} variant={'green'}>
            ارسال
        </Button>
    </div>
    </>

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

            <form className="space-y-3 rounded-lg p-4" onSubmit={event => {
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
                    <p role="alert" className="text-sm text-destructive">{error}</p>}


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
