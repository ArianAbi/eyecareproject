"use client"

import { FormFieldComboboxShorthand } from "@/components/core/FormFieldComboboxShorthand";
import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ProductType, SubCategory } from "@/generated/prisma/client";
import { parseActionError } from "@/lib/action-error";
import { ADMIN_CreateProductsAction } from "@/lib/actions/admin.products.action";
import { AllLensRanges } from "@/lib/lens-range";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod"

export default function CreateProductBtn({ categorys }: { categorys: SubCategory[] }) {
    const schema = z.object({
        name: z.string().min(3, { error: "نام حداقل 3 حرف باید باشد" }),
        description: z.string().min(3, { error: "توضیحات حداقل 3 حرف باید باشد" }),
        type: z.string(),
        price: z.string(),
        categoryId: z.string({ error: "زیرمجموعه الزامیست" }).min(1, { error: "زیرمجموعه الزامیست" }),
        lens: z.object({
            fromOd: z.string(),
            toOd: z.string()
        })
    })

    type formType = z.infer<typeof schema>

    const { control, handleSubmit, formState, getValues } = useForm<formType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            name: "",
            description: "",
            categoryId: "",
            price: "",
            type: "LENS",
            lens: {
                fromOd: "-0.00",
                toOd: "-0.00"
            }
        }
    })

    const onSubmit = handleSubmit(async values => {
        try {
            await ADMIN_CreateProductsAction(
                values.name,
                values.description,
                values.categoryId,
                values.price,
                values.type as ProductType,
                {
                    from: values.lens.fromOd,
                    to: values.lens.toOd
                }
            )

            setAlertOpen(false)

            toast.add({
                title: "دسته بندی محصول اضافه شد",
                type: "success",
            })
        } catch (err) {
            const { error } = parseActionError(err)

            if (error) {
                toast.add({
                    title: "خطا",
                    description: error,
                    type: "error"
                })
            }
            else {
                console.log(err);
                toast.add({
                    title: "unknown error, check console"
                })
            }
        }
    })

    const [alertOpen, setAlertOpen] = useState(false)

    return <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogTrigger render={
            <Button>
                <span>
                    افزودن دسته بندی محصول
                </span>
                <Plus />
            </Button>
        } />

        <AlertDialogContent>
            {/* <LoadingOverlay /> */}

            <AlertDialogHeader>
                <AlertDialogTitle>افزودن محصول</AlertDialogTitle>
            </AlertDialogHeader>

            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                    <FormFieldShorthand
                        control={control}
                        placeholder="نام"
                        label="نام محصول"
                        name="name"
                        disabled={formState.isSubmitting}
                    />
                </div>

                <FormFieldComboboxShorthand
                    control={control}
                    name="categoryId"
                    placeholder="دسته بندی"
                    label="زیرمجموعه"
                    options={categorys.map(o => ({ label: o.name, value: o.id }))}
                />

                <FormFieldShorthand
                    control={control}
                    placeholder="قیمت"
                    label="قیمت به تومان"
                    name="price"
                    type="number"
                    disabled={formState.isSubmitting}
                />

                <div className="col-span-2 gap-2 my-2 grid grid-cols-2 border-2 p-2 rounded-lg">
                    <div className="col-span-2">محدوده</div>

                    {/* from */}
                    <div>
                        <FormFieldComboboxShorthand
                            control={control}
                            name="lens.fromOd"
                            label="نمره از"
                            ltr
                            options={AllLensRanges.map(range => {
                                const rangeText = `${range.sign}${range.value}`
                                return { label: rangeText, value: rangeText }
                            })}
                        />
                    </div>

                    {/* to */}
                    <div>
                        <FormFieldComboboxShorthand
                            control={control}
                            name="lens.toOd"
                            label="تا"
                            ltr
                            options={AllLensRanges.map(range => {
                                const rangeText = `${range.sign}${range.value}`
                                return { label: rangeText, value: rangeText }
                            })}
                        />
                    </div>
                </div>



                <div className="col-span-full">
                    <FormFieldShorthand
                        control={control}
                        placeholder="توضیحات دسته بندی"
                        label="توضیحات دسته بندی"
                        name="description"
                        as="textarea"
                        disabled={formState.isSubmitting}
                    />
                </div>

                <div className="mt-4 space-x-2 col-span-full">
                    <Button disabled={!formState.isValid || formState.isSubmitting} variant={"secondary"} type="submit">
                        <span>
                            ساخت
                        </span>
                        {formState.isSubmitting && <Spinner />}
                    </Button>

                    <AlertDialogCancel disabled={formState.isSubmitting} className={buttonVariants({ variant: "outline" })}>
                        لغو
                    </AlertDialogCancel>
                </div>
            </form>
        </AlertDialogContent>
    </AlertDialog >
}