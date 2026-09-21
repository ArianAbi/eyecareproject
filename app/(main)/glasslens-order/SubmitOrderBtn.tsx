import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { SubmitCartOrderAction } from "@/lib/actions/cart.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SubmitOrderBtn({ customerNote = "", disabled = false }: { customerNote?: string, disabled?: boolean }) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const router = useRouter()

    async function SubmitOrder() {
        try {
            setLoading(true)

            await SubmitCartOrderAction({ deliveryPrice: 0, customerNote })

            toast.add({
                type: "Success",
                title: "سفارش ثبت شد"
            })

            setOpen(false)
            router.refresh()
        } catch (err) {
            if (err instanceof Error) {
                toast.add({
                    type: "error",
                    title: "مشکلی در ثبت سفارش پیش آمده. با پشتیبانی در ارتباط باشید",
                    description: err.message
                })
            }
            toast.add({
                type: "error",
                title: "مشکلی در ثبت سفارش پیش آمده. با پشتیبانی در ارتباط باشید",
            })
        } finally {
            setLoading(false)
        }
    }

    return <>
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger disabled={disabled} className={buttonVariants({ variant: 'green' })}>
                <span>
                    ثبت سفارش
                </span>
                {
                    loading &&
                    <span>
                        <Spinner />
                    </span>
                }
            </PopoverTrigger>

            <PopoverContent>
                <PopoverHeader>
                    <PopoverTitle className={'text-sm'}>
                        ثبت نهایی سفارش
                    </PopoverTitle>
                </PopoverHeader>


                <div className="flex gap-1">
                    <Button onClick={SubmitOrder} disabled={disabled || loading} variant={"green"} className="text-xs">
                        <span>
                            ثبت سفارش
                        </span>
                        {
                            loading &&
                            <span>
                                <Spinner />
                            </span>
                        }
                    </Button>

                    <Button onClick={() => setOpen(false)} variant={'outline'} className={"text-xs"}>
                        لغو
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    </>
}