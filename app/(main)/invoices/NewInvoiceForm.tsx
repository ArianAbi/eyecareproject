"use client"

import { FormFieldShorthand } from "@/components/core/FormFieldShorthand"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { useSearchParamsUtil } from "@/hooks/useSearchParams"
import { CreateInvoiceAction } from "@/lib/actions/invoices.action"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import z from "zod"

const schema = z.object({
    amount: z.number().int().max(2147483647).min(1000, "حداقل مبلغ ۱٬۰۰۰ تومان است"),
    paymentType: z.enum(["CASH", "CREDIT"])
})

type FormValues = z.infer<typeof schema>

export function NewInvoiceForm({ defaultAmount, orderBatchId, defaultOpen, defaultOpenParamKey }: {
    defaultAmount?: number
    orderBatchId?: string,
    defaultOpen?: boolean,
    defaultOpenParamKey: string,
}) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(defaultOpen ?? false)
    const { remove } = useSearchParamsUtil()

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            amount: defaultAmount,
            paymentType: "CASH"
        }
    })

    const router = useRouter()

    async function onSubmit(values: FormValues) {
        try {
            setLoading(true)

            const res = await CreateInvoiceAction({
                amount: values.amount,
                paymentType: values.paymentType,
                ...(orderBatchId ? { orderBatchId: orderBatchId } : {})
            })


            toast.add({
                type: "success",
                title: "صورتحساب ساخته شد"
            })

            setOpen(false)
            router.push(`/invoices/${res.data.id}`)
            router.refresh()
        } catch (err) {
            setLoading(false)

            console.error(err);

            toast.add({
                type: "error",
                title: "خطایی رخ داد",
                ...(err instanceof Error ? { description: err.message } : {})
            })
        } finally {
            setLoading(false)
        }
    }

    const amount = useWatch({ control: form.control, name: 'amount' })
    const paymentType = useWatch({ control: form.control, name: 'paymentType' })


    function RemoveDefaultOpenParam() {

        remove(defaultOpenParamKey)
    }

    return <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'mb-auto')}>
            افزایش موجودی
        </AlertDialogTrigger>

        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>
                    افزایش موجودی
                </AlertDialogTitle>

                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="amount" className="flex items-center">
                            <span>
                                مبلغ
                            </span>
                            {amount ? <span>
                                {amount.toLocaleString() + " "}
                                <span className="text-emerald-500 font-semibold text-xs">تومان</span>
                            </span>
                                : <></>}
                        </Label>

                        <FormFieldShorthand
                            control={form.control}
                            name="amount"
                            label=""
                            type="number"
                        />

                        {form.formState.errors.amount && (
                            <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>روش پرداخت</Label>
                        <RadioGroup
                            defaultValue="CASH"
                            onValueChange={(v) => form.setValue("paymentType", v as "CASH" | "CREDIT")}
                        >
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="CASH" id="cash" />
                                <Label htmlFor="cash">پرداخت نقدی (درگاه زرین‌پال)</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="CREDIT" id="credit" />
                                <Label htmlFor="credit">درخواست اعتبار</Label>
                            </div>

                            {paymentType === 'CREDIT' &&
                                <div className="text-wrap text-sm border-amber-600 bg-amber-500/20 border-2 p-2 rounded-md mt-1">
                                    پس از تایید کارشناسان به موجودی شما اضافه میشود و در آخر ماه با شما حساب میشود
                                </div>
                            }
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 mt-5 gap-1">
                        <Button onClick={RemoveDefaultOpenParam} type="submit" disabled={loading} className="w-full" variant={'green'}>
                            {loading ? <Spinner className="me-2" /> : null}
                            ثبت فاکتور
                        </Button>

                        <AlertDialogCancel onClick={() => RemoveDefaultOpenParam()} disabled={loading}>لغو</AlertDialogCancel>
                    </div>

                </form>
            </AlertDialogHeader>
        </AlertDialogContent>
    </AlertDialog>
}
