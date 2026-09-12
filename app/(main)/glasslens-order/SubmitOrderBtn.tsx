import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { SubmitCartOrderAction } from "@/lib/actions/cart.actions";
import { useState } from "react";

export default function SubmitOrderBtn({ disabled=false }: { disabled?: boolean }) {
    const [loading, setLoading] = useState(false)

    async function SubmitOrder() {
        try {
            setLoading(true)

            await SubmitCartOrderAction()

            toast.add({
                type: "Success",
                title: "سفارش ثبت شد"
            })
        } catch (err) {
            if (err instanceof Error) {
                toast.add({
                    type: "Error",
                    title: "مشکلی در ثبت سفارش پیش آمده. با پشتیبانی در ارتباط باشید",
                    description: err.message
                })
            }
            toast.add({
                type: "Error",
                title: "مشکلی در ثبت سفارش پیش آمده. با پشتیبانی در ارتباط باشید",
            })
        } finally {
            setLoading(false)
        }
    }

    return <Button onClick={SubmitOrder} disabled={disabled || loading} variant={"green"} className="w-full mt-auto">

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
}