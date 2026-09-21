import type { UserVerifyType } from "@/generated/prisma/enums"

export const userStatusLabels: Record<UserVerifyType, string> = {
    UNVERIFIED: 'تایید نشده',
    WAITING_FOR_APPROVAL: 'در انتظار تایید',
    VERIFIED: 'تایید شده',
    REJECTED: 'رد شده',
}
