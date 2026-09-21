"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PayInvoiceAction } from "@/lib/actions/invoices.action"
import { ADMIN_ApproveInvoiceAction, ADMIN_RejectInvoiceAction } from "@/lib/actions/admin.invoices.action"
import { Button } from "../ui/button"
import TextError from "../TextError"
import { cn } from "@/lib/utils"

export function InvoiceControls({ id, admin = false, largePayBtn = false }: { id: string, admin?: boolean, largePayBtn?: boolean }) {
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
                    className="z-50"
                    onClick={() => run('approve')}>
                    تایید اعتبار
                </Button>
                <Button
                    disabled={pending}
                    className="z-50"
                    variant="outline"
                    onClick={() => run('reject')}>
                    رد درخواست
                </Button>
            </>
                :
                <Button
                    disabled={pending}
                    className={
                        cn(
                            largePayBtn ? 'w-full max-w-xl' : ''
                        )
                    }
                    variant={largePayBtn ? 'green' : 'default'}
                    size={largePayBtn ? 'lg' : 'sm'}
                    onClick={() => run('pay')}>
                    {pending ?
                        'اتصال به درگاه…'
                        :
                        'پرداخت آنلاین'}
                </Button>
            }

        </div>{error &&
            <TextError>
                {error}
            </TextError>
        }
    </div>
}
