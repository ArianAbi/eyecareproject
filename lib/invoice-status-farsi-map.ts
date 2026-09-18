import { InvoiceStatus, InvoicePaymentType } from "@/generated/prisma/client"

export function InvoiceStatusFarsi(status: InvoiceStatus): { text: string, bg: string } {
    switch (status) {
        case "PENDING":
            return { text: "در انتظار پرداخت", bg: "bg-yellow-500" }
        case "PAID":
            return { text: "پرداخت شده", bg: "bg-emerald-500" }
        case "WAITING_FOR_APPORVAL":
            return { text: "در انتظار تایید اعتبار", bg: "bg-cyan-500" }
        case "CANCELED":
            return { text: "لغو شده", bg: "bg-red-500" }
        default:
            return { text: "نامشخص", bg: "bg-gray-400" }
    }
}

export function InvoicePaymentTypeFarsi(type: InvoicePaymentType): string {
    switch (type) {
        case "CREDIT":
            return "اعتباری"
        case "CASH":
            return "نقدی"
        default:
            return "نامشخص"
    }
}
