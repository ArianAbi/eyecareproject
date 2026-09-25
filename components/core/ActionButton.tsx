"use client"

import { unwrapActionResult } from "@/lib/action-result";
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Spinner } from "../ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { toast } from "../ui/toast"

export function ActionButton({ action, children }: { action: () => Promise<unknown>, children: React.ReactNode }) {
    const [pending, startTransition] = useTransition()

    const [open, setOpen] = useState(false)

    const router = useRouter()
    return <Popover open={open} onOpenChange={setOpen}>
        <div className="space-y-2">
            <PopoverTrigger render={
                <Button disabled={pending} size='xs' variant={'outline'} className={'mr-auto'}>
                    <span>{children}</span>
                    {pending && <Spinner />}
                </Button>
            } />

            <PopoverContent>
                <div className="flex gap-1">
                    <Button variant={'destructive'} size='xs'
                        onClick={() => startTransition(async () => {
                            try {
                                unwrapActionResult(await action());
                                router.refresh()
                                setOpen(false)
                            }
                            catch {
                                toast.add({
                                    title: 'عملیات انجام نشد؛ وضعیت را بررسی و دوباره تلاش کنید.',
                                    type: "error"
                                })
                            }
                        })}
                    >
                        بستن تیکت
                    </Button>

                    <Button variant={'outline'} size='xs' onClick={() => setOpen(false)}>
                        لغو
                    </Button>
                </div>
            </PopoverContent>
        </div>
    </Popover>
}
