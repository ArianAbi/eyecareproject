"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Prisma, SubCategory } from "@/generated/prisma/client"
import { colorOptionsType, colorSelectMap, colorSelectMapBorder } from "./FormFieldColorSelectShorthand"
import LensProductItem from "../LensProductItem"
import { IsInRange } from "@/lib/is-in-range"
import { toast } from "../ui/toast"
import { OrderProductItemType } from "@/types/order"

export function CategoryDialog({ category, range, AddToOrder }: {
    category: Prisma.SubCategoryGetPayload<{
        include: {
            products: {
                include: {
                    lens: true,
                    tags: true
                },
            },
        }
    }>,
    range: {
        od: {
            sph: string,
            cyl: string,
            aux: string
        },
        os: {
            sph: string,
            cyl: string,
            aux: string
        },
        odOnly: boolean
    }
    AddToOrder: (orderItem: OrderProductItemType) => void
}) {
    const [open, setOpen] = useState(false)

    function ConvertToAvailableProduct(product: Prisma.ProductGetPayload<{
        include: {
            lens: true,
            tags: true
        }
    }>) {
        let newProduct = { ...product, available: false }

        const odValue = {
            sph: range.od.sph,
            cyl: range.od.sph,
            aux: range.od.aux
        }
        const osValue = {
            sph: range.os.sph,
            cyl: range.os.cyl,
            aux: range.os.aux
        }

        const lensRange = {
            sphPositiveFrom: product.lens ? product.lens.positiveFromSph : "0.00",
            sphPositiveTo: product.lens ? product.lens.positivToSph : "0.00",
            sphNegativeFrom: product.lens ? product.lens.negativeFromSph : "0.00",
            sphNegativeTo: product.lens ? product.lens.negativeToSph : "0.00",
            cylFrom: product.lens ? product.lens.fromCyl : "0.00",
            cylTo: product.lens ? product.lens.toCyl : "0.00",
        }

        const odAvailability = IsInRange(odValue, lensRange)
        const osAvailability = range.odOnly ? { cylInRange: true, sphInRange: true } : IsInRange(osValue, lensRange)

        if (!odAvailability || !osAvailability) {
            toast.add({
                type: "Error",
                title: "در تحلیل نمرات مشکلی پیش آمد",
                description: "Range Conversion retured NaN"
            })

            newProduct.available = false
            return newProduct
        }

        const available = (odAvailability.sphInRange && odAvailability.cylInRange)
            && (osAvailability.sphInRange && osAvailability.cylInRange)

        newProduct.available = available
        return newProduct
    }

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
            className={`cursor-pointer border-2 rounded-lg text-center py-1 w-1/3 overflow-hidden relative group
                                        ${colorSelectMapBorder[category.color as colorOptionsType['value']]}`}
        >
            <div className={`z-[-1] ${colorSelectMap[category.color as colorOptionsType['value']]} transition-colors duration-500 
                                         opacity-20 group-hover:opacity-50
                                        size-full absolute left-0 top-0`}></div>
            <div className="z-10">
                {category.name}
            </div>
        </DialogTrigger>

        <DialogContent className="md:max-w-3xl md:w-full">
            <DialogHeader>
                <DialogTitle>
                    {category.name}
                </DialogTitle>
                <DialogDescription className="flex flex-col">
                    <span>
                        <span>OD : </span>
                        <span>{range.od.sph + " " + range.od.cyl}</span>
                    </span>
                    {!range.odOnly && <span>
                        <span>OS : </span>
                        <span>{range.os.sph + " " + range.os.cyl}</span>
                    </span>}
                </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2">
                {
                    category.products.filter(pro=>{
                        const convertedProduct = ConvertToAvailableProduct(pro)
                        
                        if(convertedProduct.available) return pro
                    }).map(product => {
                        return <LensProductItem
                            key={product.id}
                            product={ConvertToAvailableProduct(product)}
                            range={{
                                od: range.od,
                                os: range.os,
                                odOnly: range.odOnly
                            }}
                            onItemClick={(product) => {
                                setOpen(false)
                                AddToOrder(product)
                            }}
                        />
                    })
                }
            </div>
        </DialogContent>
    </Dialog>
}