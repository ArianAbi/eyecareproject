"use client"

import type { LensProductType } from "@/types/lens-product";
import Image from "next/image";

export default function LensProductItem({product}:{product:LensProductType & {available:boolean}}){
    return <div className={`flex gap-2 p-2 border-2 min-w-60 rounded-md ${product.available ? '' : 'pointer-events-none opacity-50 saturate-0'}`}>
        <div className="overflow-hidden rounded-md">
            <Image src="/placehodler.jpg" width={100} height={100} alt="placeholder"/>
        </div>

        <div className="flex flex-col gap-2">
            <span>{product.name}</span>
            <span>
                <span>{product.price.toLocaleString()}</span>
                <span className="text-emerald-500 font-semibold text-sm"> تومان </span>
            </span>
        </div>
    </div>
}