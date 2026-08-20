"use client"

import { FormFieldComboboxShorthand } from "@/components/core/FormFieldComboboxShorthand";
import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ProductType, SubCategory } from "@/generated/prisma/client";
import { parseActionError } from "@/lib/action-error";
import { ADMIN_CreateProductsAction } from "@/lib/actions/admin.products.action";
import { AllLensRanges } from "@/lib/lens-range";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod"

export default function AdminCreateProductForm({ categorys }: { categorys: SubCategory[] }) {
    const schema = z.object({
        name: z.string().min(3, { error: "نام حداقل 3 حرف باید باشد" }),
        description: z.string().min(3, { error: "توضیحات حداقل 3 حرف باید باشد" }),
        type: z.string(),
        price: z.string(),
        categoryId: z.string({ error: "زیرمجموعه الزامیست" }).min(1, { error: "زیرمجموعه الزامیست" }),
        lens: z.object({
            positiveFromSph: z.number().min(0).max(20),
            positiveToSph: z.number().min(0).max(20),
            negativeFromSph: z.number().min(0).max(-20),
            negativeToSph: z.number().min(0).max(-20),
            fromCyl: z.number().min(0).max(-6),
            toCyl: z.number().min(0).max(-6),
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
                positiveFromSph: 0,
                positiveToSph: 0,
                negativeFromSph: 0,
                negativeToSph: 0,
                fromCyl: 0,
                toCyl: 0
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
                    positiveFromSph: values.lens.positiveFromSph,
                    positiveToSph: values.lens.positiveToSph,
                    negativeFromSph: values.lens.negativeFromSph,
                    negativeToSph: values.lens.negativeToSph,
                    fromCyl: values.lens.fromCyl,
                    toCyl: values.lens.toCyl
                }
            )

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

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-2" >
            <div className="">
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

                <div className="border p-2 rounded-md gap-2 grid grid-cols-2 col-span-2">

                    <div className="my-2 font-semibold col-span-full gap-2">
                        Sphere
                    </div>

                    <div className="border-2 border-emerald-700/50 p-2 rounded-lg px-2">
                        {/* positive from */}

                        <div>
                            <FormFieldComboboxShorthand
                                control={control}
                                name="lens.positiveFromSph"
                                label="نمره مثبت از"
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
                                name="lens.positiveToSph"
                                label="تا"
                                ltr
                                options={AllLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                            />
                        </div>
                    </div>

                    <div className="border-2 border-emerald-700/50 p-2 rounded-lg px-2">
                        {/* negative from */}
                        <div>
                            <FormFieldComboboxShorthand
                                control={control}
                                name="lens.negativeFromSph"
                                label="نمره منفی از"
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
                                name="lens.negativeToSph"
                                label="تا"
                                ltr
                                options={AllLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                            />
                        </div>
                    </div>

                    <div className="my-2 font-semibold col-span-full gap-2">
                        Cylinder
                    </div>

                    <div className="border-2 grid grid-cols-2 gap-2 col-span-full border-yellow-700/50 p-2 rounded-lg px-2">
                        {/* negative from */}
                        <div>
                            <FormFieldComboboxShorthand
                                control={control}
                                name="lens.fromCyl"
                                label="سیلندر از"
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
                                name="lens.toCyl"
                                label="تا"
                                ltr
                                options={AllLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                            />
                        </div>
                    </div>
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

            </div>
        </form >
    )
}