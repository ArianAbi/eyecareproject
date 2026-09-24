import { Product } from "@/generated/prisma/client";

export interface CartItemProductItemType extends Product {
    od: { sph: string, cyl: string, aux: string },
    os: { sph: string, cyl: string, aux: string },
    odOnly:boolean,
    rawOrCut:boolean
}

type CartStatus = "pending" | "success" | "error"

type OrderProductItemWithStatus = CartItemProductItemType & {
    guaranteeClientName?: string
    tempId: string        // stable client-side id, see note below
    cartStatus: CartStatus
    cartItemId?: string   // real DB id, filled in once the insert succeeds
}