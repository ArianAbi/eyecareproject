"use client"

import type { LensProductType } from "@/types/lens-product";
import { OrderProductItemType } from "@/types/order";
import Image from "next/image";

export default function LensProductItem({ product, range, onClick }: {
    product: LensProductType & { available: boolean },
    range: { od: { sph: string, cyl: string }, os: { sph: string, cyl: string } },
    onClick: (product: OrderProductItemType) => void
}) {
    return <button
        onClick={() => {
            const _product = {
                ...product,
                od: { sph: range.od.sph, cyl: range.od.cyl },
                os: { sph: range.os.sph, cyl: range.os.cyl }
            }

            onClick(_product)
        }}
        className={`bg-white/0 hover:bg-white/10 h-fit cursor-pointer transition-colors duration-300 flex gap-2 p-2 border-2 w-full rounded-md ${product.available ? '' : 'pointer-events-none opacity-50 saturate-0'}`}>
        <div className="overflow-hidden size-17.5 h-fit rounded-md">
            <Image src="/placehodler.jpg" width={70} height={70} alt="placeholder" />
        </div>

        <div className="flex flex-col gap-2">
            <span>{product.name}</span>
            <span className="text-[14px] mt-auto text-right">
                <span>{product.price.toLocaleString()}</span>
                <span className="text-emerald-500 font-semibold text-[12px]"> تومان </span>
            </span>
        </div>
    </button>
}