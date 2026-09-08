import { Product } from "@/generated/prisma/client";

export interface OrderProductItemType extends Product {
    od: { sph: string, cyl: string, aux: string },
    os: { sph: string, cyl: string, aux: string },
    odOnly:boolean
}
