"use client"

import type { LensProductType } from "@/types/lens-product";
import { OrderProductItemType } from "@/types/order";
import Image from "next/image";

export default function LensProductItem({ product, range, onItemClick }: {
    product: LensProductType & { available: boolean },
    range: { od: { sph: string, cyl: string, aux: string }, os: { sph: string, cyl: string, aux: string } ,odOnly:boolean},
    onItemClick: (product: OrderProductItemType) => void
}) {
    //since the price is for two lenses, if its only one lens (OD ONLY) it should be half
    const calculatedPrice = product.price / (range.odOnly == true ? 2 : 1)
    
    return <button
        onClick={() => {
            const _product = {
                ...product,
                od: { sph: range.od.sph, cyl: range.od.cyl, aux: range.od.aux },
                os: { sph: range.os.sph, cyl: range.os.cyl, aux: range.os.aux },
                odOnly : range.odOnly
            }

            onItemClick(_product)
        }}
        className={`bg-white/0 hover:bg-white/10 h-fit cursor-pointer transition-colors duration-300 flex gap-2 p-2 border-2 w-full rounded-md ${product.available ? '' : 'pointer-events-none opacity-50 saturate-0'}`}>
        <div className="overflow-hidden size-17.5 h-fit rounded-md">
            <Image src="/placehodler.jpg" width={70} height={70} alt="placeholder" />
        </div>

        <div className="flex flex-col gap-2">
            <span>{product.name}</span>

            {
                product.available ?
                    <span className="text-[14px] mt-auto text-right">
                        <span>{calculatedPrice.toLocaleString()}</span>
                        <span className="text-emerald-500 font-semibold text-[12px]"> تومان </span>
                    </span>
                    :
                    <span className="text-[14px] mt-auto text-right">
                        خارج از محدوده
                    </span>
            }
        </div>
    </button>
}