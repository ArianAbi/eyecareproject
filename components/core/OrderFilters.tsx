import { QueryFilters } from "./QueryFilters"
import { orderStatuses } from "@/lib/order-filters"
import { OrderStatusFarsi } from "@/lib/order-status-farsi-map"

export function OrderFilters({ admin = false, pending = false }: { admin?: boolean, pending?: boolean }) {
    return <QueryFilters admin={admin} order statuses={pending ? undefined : orderStatuses.filter(s => !admin || s !== 'PENDING').map(value => ({ value, label: OrderStatusFarsi(value).text }))} />
}
