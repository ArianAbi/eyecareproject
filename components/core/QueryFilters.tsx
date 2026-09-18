"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { DateFilter } from "./DateFilter"
import { AdminUserSearchFilter } from "./AdminUserSearchFilter"

export type FilterOption = { value: string, label: string }

export function QueryFilters({ statuses, admin = false, order = false, payment = false, date = true }: {
    statuses?: FilterOption[], admin?: boolean, order?: boolean, payment?: boolean, date?: boolean
}) {
    const search = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    function change(key: string, value: string | null) {
        const params = new URLSearchParams(search.toString())
        if (value && value !== 'ALL') params.set(key, value)
        else params.delete(key)
        for (const page of ['page', 'pendingPage', 'restPage']) params.delete(page)
        router.push(`${pathname}?${params}`)
    }
    return <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        {admin && <div className="w-52"><AdminUserSearchFilter key={search.get('userId')} initialValue={search.get('userId') ?? undefined} paramKey="userId" /></div>}
        {date && <DateFilter key={search.get('date')} initialValue={search.get('date') ?? undefined} paramKey="date" />}
        {statuses && <div className="space-y-1"><span className="text-xs">وضعیت</span>
            <Select value={search.get('status') ?? 'ALL'} onValueChange={value => change('status', value)}>
                <SelectTrigger aria-label="وضعیت"><SelectValue>{statuses.find(s => s.value === search.get('status'))?.label ?? 'همه وضعیت‌ها'}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value="ALL">همه وضعیت‌ها</SelectItem>{statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select></div>}
        {payment && <Select value={search.get('paymentType') ?? 'ALL'} onValueChange={value => change('paymentType', value)}>
            <SelectTrigger aria-label="نوع پرداخت"><SelectValue>{search.get('paymentType') === 'CASH' ? 'نقدی' : search.get('paymentType') === 'CREDIT' ? 'اعتباری' : 'همه روش‌ها'}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="ALL">همه روش‌ها</SelectItem><SelectItem value="CASH">نقدی</SelectItem><SelectItem value="CREDIT">اعتباری</SelectItem></SelectContent>
        </Select>}
        {order && <>
            <form onSubmit={event => { event.preventDefault(); change('orderNumber', String(new FormData(event.currentTarget).get('orderNumber') ?? '')) }} className="flex gap-2">
                <Input key={search.get('orderNumber')} aria-label="شماره سفارش" name="orderNumber" defaultValue={search.get('orderNumber') ?? ''} placeholder="شماره سفارش" type="number" min={1} className="w-36" />
                <Button type="submit" variant="outline">جستجو</Button>
            </form>
            <Select value={search.get('sort') ?? 'newest'} onValueChange={value => change('sort', value)}>
                <SelectTrigger aria-label="ترتیب"><SelectValue>{search.get('sort') === 'oldest' ? 'قدیمی‌ترین' : 'جدیدترین'}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value="newest">جدیدترین</SelectItem><SelectItem value="oldest">قدیمی‌ترین</SelectItem></SelectContent>
            </Select>
        </>}
        <Button variant="ghost" onClick={() => router.push(`${pathname}${search.get('tab') ? `?tab=${encodeURIComponent(search.get('tab')!)}` : ''}`)}>پاک کردن فیلترها</Button>
    </div>
}
