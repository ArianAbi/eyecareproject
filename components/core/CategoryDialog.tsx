"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Prisma } from "@/generated/prisma/client"
import { colorOptionsType, colorSelectMap, colorSelectMapBorder } from "./FormFieldColorSelectShorthand"
import LensProductItem from "../LensProductItem"
import { lensEligible } from "@/lib/lens-policy"
import { CartItemProductItemType } from "@/types/order"

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
    AddToOrder: (orderItem: CartItemProductItemType) => void
}) {
    const [open, setOpen] = useState(false)

    function ConvertToAvailableProduct(product: Prisma.ProductGetPayload<{
        include: {
            lens: true,
            tags: true
        }
    }>) {
        return { ...product, available: product.active && product.type === "LENS" && lensEligible(product.lens, range) }
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
                    category.products.map(product => {
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