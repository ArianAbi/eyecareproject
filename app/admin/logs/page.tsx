import { ADMIN_GetLogsAction } from "@/lib/actions/admin.logs.action"
import { selectedUser } from "@/lib/order-filters"
import { QueryFilters } from "@/components/core/QueryFilters"
import CustomPagination from "@/components/core/CustomPagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ page?: string, userId?: string, date?: string, action?: string, entityType?: string }> }) {
    const params = await searchParams
    const data = await ADMIN_GetLogsAction({ ...params, userId: selectedUser(params.userId) })
    return <div className="space-y-4"><h1 className="text-xl font-semibold">گزارش فعالیت‌ها</h1>
        <QueryFilters admin />
        <form className="flex flex-wrap gap-2">
            {params.userId && <input type="hidden" name="userId" value={params.userId} />}{params.date && <input type="hidden" name="date" value={params.date} />}
            <Input aria-label="نام رویداد" name="action" defaultValue={params.action} placeholder="رویداد، مانند INVOICE_APPROVED" className="max-w-xs" />
            <Input aria-label="نوع رکورد" name="entityType" defaultValue={params.entityType} placeholder="نوع رکورد، مانند Ticket" className="max-w-xs" /><Button type="submit">جستجو</Button>
        </form>
        <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>زمان</TableHead><TableHead>کاربر</TableHead><TableHead>رویداد</TableHead><TableHead>رکورد</TableHead><TableHead>جزئیات</TableHead></TableRow></TableHeader>
            <TableBody>{data.logs.map(log => <TableRow key={log.id}><TableCell>{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(log.createdAt)}</TableCell><TableCell>{log.actor?.username ?? 'سیستم / کاربر حذف‌شده'}</TableCell><TableCell dir="ltr">{log.action}</TableCell><TableCell className="max-w-60 break-all text-xs">{log.entityType} · {log.entityId}</TableCell><TableCell>{log.detail ?? '—'}</TableCell></TableRow>)}{!data.total && <TableRow><TableCell colSpan={5} className="h-24 text-center">رویدادی یافت نشد.</TableCell></TableRow>}</TableBody>
        </Table></div><CustomPagination total={data.total} paramKey="page" />
    </div>
}
