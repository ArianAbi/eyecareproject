"use client"

import { FormFieldComboboxShorthand } from "@/components/core/FormFieldComboboxShorthand"
import LensProductItem from "@/components/LensProductItem"
import { Lens, Prisma, Product, SubCategory, Tags } from "@/generated/prisma/client"
import { IsInRange } from "@/lib/is-in-range"
import { lensFilter } from "@/lib/lens-filter"
import { AllLensRanges } from "@/lib/lens-range"
import { LensProductType } from "@/types/lens-product"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"


type ProductWithAvailability = LensProductType & { available: boolean }

export default function GlasslensOrderPage({ products, categorys, tags }: {
    products: LensProductType[],
    categorys: Prisma.SubCategoryGetPayload<{ include: { products: true } }>[],
    tags: Tags[]
}) {

    const [selectedCategory, setSelectedCategory] = useState("")

    const [productsState, setProductsState] = useState<ProductWithAvailability[]>(
        products.map(p => ({ ...p, available: true }))
    )

    const schema = z.object({
        od: z.object({
            sph: z.string(),
            cyl: z.string()
        }),
        os: z.object({
            sph: z.string(),
            cyl: z.string()
        })
    })

    const { control, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            od: {
                sph: "0.00",
                cyl: "0.00"
            },
            os: {
                sph: "0.00",
                cyl: "0.00"
            }
        }
    })

    useEffect(() => {
        const checkAvailability = (values: {
            od?: { sph?: string; cyl?: string }
            os?: { sph?: string; cyl?: string }
        }) => {
            setProductsState(prev => prev.map((product): ProductWithAvailability => {
                let _product = { ...product }

                const odSph = values.od?.sph

                const lensSphRange = {
                    positiveFrom: product.lens ? product.lens.positiveFromSph : "0.00",
                    positiveTo: product.lens ? product.lens.positivToSph : "0.00",
                    negativeFrom: product.lens ? product.lens.negativeFromSph : "0.00",
                    negativeTo: product.lens ? product.lens.negativeToSph : "0.00",
                }

                const available = odSph ? IsInRange(odSph, lensSphRange) : true

                _product.available = available ?? true
                return _product
            }))
        }

        // watch's callback form only fires on change, not on mount —
        // run once immediately so initial state reflects default form values
        checkAvailability(watch())

        const subscription = watch((values) => checkAvailability(values))

        return () => subscription.unsubscribe()
    }, [watch])


    return (
        <div className="border p-3 rounded-md">
            <table dir="ltr">
                <thead>
                    <tr>
                        <th style={{ minWidth: "50px" }}></th>
                        <th>SPH</th>
                        <th>CYL</th>
                    </tr>
                </thead>

                <tbody>
                    {/* OD */}
                    <tr>
                        <td className="p-2">OD </td>

                        {/* Sph */}
                        <td className="px-1">
                            <FormFieldComboboxShorthand
                                control={control}
                                name="od.sph"
                                label=""
                                ltr
                                emptySnapValue="0.00"
                                options={AllLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                                filter={lensFilter}
                            />
                        </td>

                        {/* Cyl */}
                        <td className="px-1">
                            <FormFieldComboboxShorthand
                                control={control}
                                name="od.cyl"
                                label=""
                                ltr
                                emptySnapValue="0.00"
                                options={AllLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                                filter={lensFilter}
                            />
                        </td>
                    </tr>

                    {/* OS */}
                    <tr>
                        <td className="p-2">OS </td>

                        {/* Sph */}
                        <td className="px-1">
                            <FormFieldComboboxShorthand
                                control={control}
                                name="os.sph"
                                label=""
                                ltr
                                emptySnapValue="0.00"
                                options={AllLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                                filter={lensFilter}
                            />
                        </td>

                        {/* Cyl */}
                        <td className="px-1">
                            <FormFieldComboboxShorthand
                                control={control}
                                name="os.cyl"
                                label=""
                                ltr
                                emptySnapValue="0.00"
                                options={AllLensRanges.map(range => {
                                    const rangeText = `${range.sign}${range.value}`
                                    return { label: rangeText, value: rangeText }
                                })}
                                filter={lensFilter}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* categorys */}
            <div className="flex gap-2 justify-between">
                {
                    categorys.map(cate => {
                        return <button className="bg-white/0 border-2 rounded-lg text-center py-1 w-1/3">
                            {cate.name}
                        </button>
                    })
                }
            </div>

            <div className="flex gap-3 justify-center mt-4 flex-wrap">
                {
                    productsState.map(product => {
                        return <LensProductItem key={product.id} product={product} />
                    })
                }
            </div>

        </div>
    )
}