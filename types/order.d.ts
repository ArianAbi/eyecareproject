import { Product } from "@/generated/prisma/client";

export interface OrderProductItemType extends Product {
    od: { sph: string, cyl: string },
    os: { sph: string, cyl: string }
}
