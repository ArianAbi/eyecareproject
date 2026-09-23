"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ADMIN_DeductDailyOrderFeeAction } from "@/lib/actions/admin.today-orders.action"
import type { TodayOrder } from "@/lib/todays-orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

export type DailyFeeReceipt = { id: string, userId: string, amount: number, kind: string, reason: string }

export function DailyOrderFee({ user, day, deliveryPrice, charges }: {
    user: TodayOrder["user"], day: string, deliveryPrice: number, charges: DailyFeeReceipt[],
}) {
    const [kind, setKind] = useState<"delivery" | "custom">("delivery")
    const [customAmount, setCustomAmount] = useState("")
    const [reason, setReason] = useState("")
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [pending, startTransition] = useTransition()
    const request = useRef<{ key: string, id: string } | null>(null)
    const busy = useRef(false)
    const router = useRouter()
    const deliveryPaid = charges.some(charge => charge.kind === "delivery")
    const amount = kind === "delivery" ? deliveryPrice : Number(customAmount)
    const valid = Number.isSafeInteger(amount) && amount > 0 && amount <= 2147483647
        && amount <= user.credit && (kind === "delivery" ? !deliveryPaid : reason.trim().length >= 3)

    return <div className="space-y-3 border-t bg-muted/20 p-3">
        <h3 className="text-sm font-medium">کسر هزینه از اعتبار {user.username}</h3>
        <p className="text-xs text-muted-foreground">هزینه‌ای جدا برای مجموع سفارش‌های امروز این کاربر؛ مبالغ ارسال جدول از قبل در سفارش‌ها ثبت شده‌اند.</p>
        <form className="flex flex-wrap items-end gap-3" onSubmit={event => {
            event.preventDefault()
            if (!valid || busy.current) return
            setError(""); setMessage("")
            const description = kind === "delivery" ? "هزینه ارسال سفارش‌های روز" : reason.trim()
            const key = JSON.stringify([day, kind, amount, description])
            if (request.current?.key !== key) request.current = { key, id: crypto.randomUUID() }
            const requestId = request.current.id
            busy.current = true
            startTransition(async () => {
                try {
                    const result = await ADMIN_DeductDailyOrderFeeAction({
                        userId: user.id, day, kind, amount, reason: description, expectedCredit: user.credit, requestId,
                    })
                    if (!result.success) { setError(result.error); return }
                    setMessage(result.alreadyApplied ? "این هزینه قبلاً ثبت شده است؛ دوباره کسر نشد." : "هزینه از اعتبار کسر و برای کاربر ثبت شد.")
                    request.current = null
                    setCustomAmount(""); setReason("")
                    router.refresh()
                } catch { setError("نتیجه درخواست دریافت نشد. می‌توانید همین درخواست را دوباره ارسال کنید؛ کسر تکراری انجام نمی‌شود.") }
                finally { busy.current = false }
            })
        }}>
            <div className="space-y-1">
                <Label htmlFor={`fee-kind-${user.id}`}>نوع هزینه</Label>
                <Select value={kind} disabled={pending} onValueChange={value => {
                    if (value === "delivery" || value === "custom") { setKind(value); setError(""); setMessage("") }
                }}>
                    <SelectTrigger id={`fee-kind-${user.id}`} className="w-44">{kind === "delivery" ? "هزینه ارسال روز" : "مبلغ دلخواه"}</SelectTrigger>
                    <SelectContent><SelectItem value="delivery">هزینه ارسال روز</SelectItem><SelectItem value="custom">مبلغ دلخواه</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="space-y-1">
                <Label htmlFor={`fee-amount-${user.id}`}>مبلغ (تومان)</Label>
                <Input id={`fee-amount-${user.id}`} className="w-40" type="number" min={1} max={2147483647} step={1}
                    required disabled={pending} readOnly={kind === "delivery"} value={kind === "delivery" ? deliveryPrice : customAmount}
                    onChange={event => setCustomAmount(event.target.value)} />
            </div>
            {kind === "custom" && <div className="min-w-48 flex-1 space-y-1">
                <Label htmlFor={`fee-reason-${user.id}`}>توضیح قابل نمایش به کاربر</Label>
                <Input id={`fee-reason-${user.id}`} required minLength={3} maxLength={300} disabled={pending} value={reason} onChange={event => setReason(event.target.value)} placeholder="علت کسر هزینه" />
            </div>}
            <Button type="submit" disabled={pending || !valid}>{pending ? "در حال ثبت…" : `کسر ${Number.isFinite(amount) ? amount.toLocaleString("fa-IR") : "۰"} تومان`}</Button>
        </form>
        {kind === "delivery" && deliveryPaid && <p className="text-sm text-muted-foreground">هزینه ارسال امروز قبلاً کسر شده است.</p>}
        {kind === "delivery" && deliveryPrice <= 0 && <p className="text-sm text-muted-foreground">هزینه ارسال در تنظیمات صفر است؛ مبلغ دلخواه وارد کنید یا تنظیمات ارسال را تغییر دهید.</p>}
        {amount > user.credit && <p className="text-sm text-destructive">اعتبار کاربر برای این مبلغ کافی نیست.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
        {charges.length > 0 && <div className="space-y-1 text-xs"><p className="font-medium">هزینه‌های کسرشده امروز:</p>{charges.map(charge => <p key={charge.id}>{charge.reason} · {charge.amount.toLocaleString("fa-IR")} تومان</p>)}</div>}
    </div>
}
