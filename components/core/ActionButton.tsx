"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"

export function ActionButton({ action, children }: { action: () => Promise<unknown>, children: React.ReactNode }) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()
    return <div className="space-y-2">
        <Button disabled={pending} onClick={() => startTransition(async () => {
            setError('')
            try { await action(); router.refresh() }
            catch { setError('عملیات انجام نشد؛ وضعیت را بررسی و دوباره تلاش کنید.') }
        })}>{pending ? 'در حال انجام…' : children}</Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
}
