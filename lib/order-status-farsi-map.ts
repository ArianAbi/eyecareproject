import { OrderItemStatus } from "@/generated/prisma/enums"

export const OrderStatusFarsi = (status: OrderItemStatus) => {
    let value = ''
    let color = 'bg-gray-500'

    switch (status) {
        case 'PENDING':
            value = 'در انتظار تایید'
            color = 'bg-taupe-400'
            break;
        case 'APPROVED':
            value = 'تایید شده'
            color = 'bg-cyan-500'
            break;
        case 'INPROCESS':
            value = 'درحال انجام'
            color = 'bg-blue-500'
            break;
        case 'ONHOLD':
            value = 'متوقف شده'
            color = 'bg-amber-500'
            break;
        case 'FINISHED':
            value = 'تمام شده'
            color = 'bg-teal-500'
            break;
        case 'SENT':
            value = 'ارسال شده'
            color = 'bg-green-500'
            break;

        default:
            value = 'نامشحص'
            color = 'bg-rose-500'
            break;
    }

    return {text:value,bg:color}
}