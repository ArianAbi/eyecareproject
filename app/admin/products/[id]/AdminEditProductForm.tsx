"use client"

import { FormFieldComboboxShorthand } from "@/components/core/FormFieldComboboxShorthand";
import { FormFieldShorthand } from "@/components/core/FormFieldShorthand";
import { FormFieldTagsShorthand } from "@/components/core/FormFieldTagsShorthand";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import type { Prisma, ProductType, SubCategory, Tags } from "@/generated/prisma/client";
import { parseActionError } from "@/lib/action-error";
import { ADMIN_UpdateProduct } from "@/lib/actions/admin.products.action";
import { lensFilter } from "@/lib/lens-filter";
import { NegativeLensRanges, PositiveLensRanges } from "@/lib/lens-range";
import { zodResolver } from "@hookform/resolvers/zod";
import { Handbag, SprayCan, TowelRack } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod"

export default function AdminEditProductForm({ id, categorys, product, tags }: {
    id: string,
    categorys: SubCategory[],
    product: Prisma.ProductGetPayload<{
        include: {
            lens: true,
            tags: true
        }
    }>,
    tags: Tags[]
}) {

    const schema = z.object({
        name: z.string().min(3, { error: "نام حداقل 3 حرف باید باشد" }),
        description: z.string().min(3, { error: "توضیحات حداقل 3 حرف باید باشد" }),
        type: z.string(),
        price: z.number(),
        categoryId: z.string({ error: "زیرمجموعه الزامیست" }).min(1, { error: "زیرمجموعه الزامیست" }),
        tags: z.string().array(),
        lens: z.object({
            positiveFromSph: z.string(),
            positivToSph: z.string(),
            negativeFromSph: z.string(),
            negativeToSph: z.string(),
            fromCyl: z.string(),
            toCyl: z.string()
        }),
        includesBag: z.boolean(),
        includesSpray: z.boolean(),
        includesCloth: z.boolean(),
    })

    type formType = z.infer<typeof schema>

    const { control, handleSubmit, formState, watch, setValue } = useForm<formType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            price: product.price,
            type: product.type,
            includesBag: product.includesBag,
            includesCloth: product.includesCleaningCloth,
            includesSpray: product.includesCleaningSpray,
            ...(product.tags ?
                {
                    tags: product.tags.map(tag => tag.id)
                }
                :
                {}
            ),
            ...(product.lens ?
                {
                    lens: {
                        positiveFromSph: product.lens.positiveFromSph,
                        positivToSph: product.lens.positivToSph,
                        negativeFromSph: product.lens.negativeFromSph,
                        negativeToSph: product.lens.negativeToSph,
                        fromCyl: product.lens.fromCyl,
                        toCyl: product.lens.toCyl,
                    }
                }
                :
                {
                    lens: {
                        positiveFromSph: "0.00",
                        positivToSph: "0.00",
                        negativeFromSph: "0.00",
                        negativeToSph: "0.00",
                        fromCyl: "0.00",
                        toCyl: "0.00",
                    }
                }
            )
        }
    })

    const price = watch("price")

    const route = useRouter()

    const onSubmit = handleSubmit(async values => {
        try {

            await ADMIN_UpdateProduct(id, {
                name: values.name,
                description: values.description,
                type: values.type as ProductType,
                price: values.price,
                categoryId: values.categoryId,
                lens: values.lens,
                tagIds: values.tags,
                includesBag: values.includesBag,
                includesCloth: values.includesCloth,
                includesSpray: values.includesSpray,
                // tagIds omitted on purpose — this form doesn't manage tags
            });

            toast.add({
                title: "محصول اضافه شد",
                type: "success",
            })

            route.push(`/admin/products`)
        } catch (err) {
            console.log(err);

            const { error } = parseActionError(err)

            if (error) {
                toast.add({
                    title: "خطا",
                    description: error,
                    type: "error"
                })
            }
            else {
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

            <div>
                <FormFieldShorthand
                    control={control}
                    placeholder="قیمت"
                    label="قیمت به تومان"
                    name="price"
                    type="number"
                    disabled={formState.isSubmitting}
                />

                {
                    price > 0 &&
                    <div className="flex gap-1 mt-2 text-sm">
                        <div>
                            {price.toLocaleString()}
                        </div>

                        <div className="text-emerald-500 font-semibold">
                            تومان
                        </div>
                    </div>
                }
            </div>

            {/* tags */}
            <div>
                <FormFieldTagsShorthand
                    control={control}
                    name="tags"
                    placeholder="تگ ها"
                    options={tags.map(tag => {
                        return { label: tag.name, value: tag.id, color: tag.color }
                    })}
                    label="تگ ها"
                />
            </div>

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
                                emptySnapValue="0.00"
                                filter={lensFilter}
                                options={PositiveLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                            />
                        </div>

                        {/* to */}
                        <div>
                            <FormFieldComboboxShorthand
                                control={control}
                                name="lens.positivToSph"
                                label="تا"
                                emptySnapValue="0.00"
                                ltr
                                filter={lensFilter}
                                options={PositiveLensRanges.map(range => {
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
                                emptySnapValue="0.00"
                                ltr
                                filter={lensFilter}
                                options={NegativeLensRanges.map(range => {
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
                                emptySnapValue="0.00"
                                ltr
                                filter={lensFilter}
                                options={NegativeLensRanges.map(range => {
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
                                emptySnapValue="0.00"
                                ltr
                                filter={lensFilter}
                                options={NegativeLensRanges.map(range => {
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
                                emptySnapValue="0.00"
                                ltr
                                filter={lensFilter}
                                options={NegativeLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* packaging inclusions */}
            <div className="col-span-full flex justify-around my-2 border py-3 rounded-lg">
                {/* handbag */}
                <div className="grid grid-cols-2 center gap-1">
                    <Checkbox
                        className="size-5"
                        checked={watch().includesBag}
                        onCheckedChange={(e) => {
                            setValue('includesBag', e)
                        }}
                    />

                    <div className={watch().includesBag ? 'stroke-white' : 'stroke-gray-400'}>
                        <Handbag stroke="inherit" size={26} />
                    </div>

                    <div className={`col-span-2 ${watch().includesBag ? 'text-white' : 'text-gray-400'}`}>ساکدستی</div>
                </div>

                {/* spray */}
                <div className="grid grid-cols-2 center gap-1">
                    <Checkbox
                        className="size-5"
                        checked={watch().includesSpray}
                        onCheckedChange={(e) => {
                            setValue('includesSpray', e)
                        }}
                    />

                    <div className={watch().includesSpray ? 'stroke-white' : 'stroke-gray-400'}>
                        <SprayCan stroke="inherit" size={26} />
                    </div>

                    <div className={`col-span-2 ${watch().includesSpray ? 'text-white' : 'text-gray-400'}`}>اسپری</div>
                </div>

                {/* cloth */}
                <div className="grid grid-cols-2 center gap-1">
                    <Checkbox
                        className="size-5"
                        checked={watch().includesCloth}
                        onCheckedChange={(e) => {
                            setValue('includesCloth', e)
                        }}
                    />

                    <div className={watch().includesCloth ? 'stroke-white' : 'stroke-gray-400'}>
                        <TowelRack stroke="inherit" size={26} />
                    </div>

                    <div className={`col-span-2 ${watch().includesCloth ? 'text-white' : 'text-gray-400'}`}>دستمال</div>
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
                        بروزرسانی
                    </span>
                    {formState.isSubmitting && <Spinner />}
                </Button>

                <Link
                    href={`/admin/products`}
                    className={buttonVariants({ variant: "outline" })}
                >
                    برگشت
                </Link>

            </div>
        </form >
    )
}