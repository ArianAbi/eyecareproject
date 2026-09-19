"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PayInvoiceAction } from "@/lib/actions/invoices.action"
import { ADMIN_ApproveInvoiceAction, ADMIN_RejectInvoiceAction } from "@/lib/actions/admin.invoices.action"
import { Button } from "../ui/button"

export function InvoiceControls({ id, admin = false }: { id: string, admin?: boolean }) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()
    function run(action: 'pay' | 'approve' | 'reject') {
        startTransition(async () => {
            setError('')
            try {
                if (action === 'pay') {
                    const result = await PayInvoiceAction(id)
                    window.location.assign(result.redirectUrl)
                } else {
                    await (action === 'approve' ? ADMIN_ApproveInvoiceAction : ADMIN_RejectInvoiceAction)(id)
                    router.refresh()
                }
            } catch { setError('عملیات انجام نشد؛ دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.') }
        })
    }
    return <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
            {admin ? <>
                <Button
                    disabled={pending}
                    onClick={() => run('approve')}>
                    تایید اعتبار
                </Button>
                <Button
                    disabled={pending}
                    variant="outline"
                    onClick={() => run('reject')}>
                    رد درخواست
                </Button>
            </>
                :
                <Button
                    disabled={pending}
                    onClick={() => run('pay')}>
                    {pending ?
                        'اتصال به درگاه…'
                        :
                        'پرداخت آنلاین'}
                </Button>
            }

        </div>{error || true && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
}
