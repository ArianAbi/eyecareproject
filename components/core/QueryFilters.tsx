"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ListFilter, Search, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../ui/sheet"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { DateFilter } from "./DateFilter"
import { AdminUserSearchFilter } from "./AdminUserSearchFilter"

export type FilterOption = { value: string, label: string }

const PAYMENT_OPTIONS: FilterOption[] = [
    { value: 'ALL', label: 'همه روش‌ها' },
    { value: 'CASH', label: 'نقدی' },
    { value: 'CREDIT', label: 'اعتباری' },
]

const SORT_OPTIONS: FilterOption[] = [
    { value: 'newest', label: 'جدیدترین' },
    { value: 'oldest', label: 'قدیمی‌ترین' },
]

function FilterField({ label, children }: { label: string, children: React.ReactNode }) {
    return <div className="space-y-2">
        <Label>{label}</Label>
        {children}
    </div>
}

function FilterSelect({ label, value, options, onChange }: {
    label: string, value: string, options: FilterOption[], onChange: (value: string | null) => void
}) {
    return <FilterField label={label}>
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger aria-label={label} className="w-full">
                <SelectValue>
                    {options.find(o => o.value === value)?.label}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {options.map(o => <SelectItem key={o.value} value={o.value}>
                    {o.label}
                </SelectItem>)}
            </SelectContent>
        </Select>
    </FilterField>
}

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

    function clear() {
        const tab = search.get('tab')
        router.push(`${pathname}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`)
    }

    const activeCount = [
        admin && search.get('userId'),
        date && search.get('date'),
        statuses && search.get('status'),
        payment && search.get('paymentType'),
        order && search.get('orderNumber'),
        order && search.get('sort') === 'oldest',
    ].filter(Boolean).length

    const statusOptions: FilterOption[] = [{ value: 'ALL', label: 'همه وضعیت‌ها' }, ...(statuses ?? [])]

    return <div className="mb-4 flex items-center gap-2">
        <Sheet>
            <SheetTrigger render={<Button size={'sm'} variant="outline" />}>
                <ListFilter />
                فیلترها
                {activeCount > 0 &&
                    <Badge className="ms-1 h-5 min-w-5 rounded-full px-1.5">
                        {activeCount.toLocaleString('fa-IR')}
                    </Badge>
                }
            </SheetTrigger>

            <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-sm">
                <SheetHeader>
                    <SheetTitle>فیلترها</SheetTitle>
                    <SheetDescription>
                        نتایج بلافاصله با تغییر هر فیلتر به‌روزرسانی می‌شوند.
                    </SheetDescription>
                </SheetHeader>

                <Separator />

                <div className="flex-1 space-y-5 overflow-y-auto p-4">
                    {admin &&
                        <AdminUserSearchFilter
                            key={search.get('userId')}
                            initialValue={search.get('userId') ?? undefined}
                            paramKey="userId" />
                    }

                    {date &&
                        <DateFilter
                            key={search.get('date')}
                            initialValue={search.get('date') ?? undefined}
                            paramKey="date" />
                    }

                    {statuses &&
                        <FilterSelect
                            label="وضعیت"
                            value={search.get('status') ?? 'ALL'}
                            options={statusOptions}
                            onChange={value => change('status', value)} />
                    }

                    {payment &&
                        <FilterSelect
                            label="نوع پرداخت"
                            value={search.get('paymentType') ?? 'ALL'}
                            options={PAYMENT_OPTIONS}
                            onChange={value => change('paymentType', value)} />
                    }

                    {order && <>
                        <FilterField label="شماره سفارش">
                            <form
                                className="flex gap-2"
                                onSubmit={event => {
                                    event.preventDefault()
                                    change('orderNumber', String(new FormData(event.currentTarget).get('orderNumber') ?? ''))
                                }}>
                                <Input
                                    key={search.get('orderNumber')}
                                    aria-label="شماره سفارش"
                                    name="orderNumber"
                                    type="number"
                                    min={1}
                                    placeholder="مثلاً ۱۲۳"
                                    defaultValue={search.get('orderNumber') ?? ''}
                                    className="flex-1" />
                                <Button type="submit" variant="secondary" size="icon" aria-label="جستجو">
                                    <Search />
                                </Button>
                            </form>
                        </FilterField>

                        <FilterSelect
                            label="ترتیب"
                            value={search.get('sort') ?? 'newest'}
                            options={SORT_OPTIONS}
                            onChange={value => change('sort', value)} />
                    </>}
                </div>

                <Separator />

                <SheetFooter>
                    <SheetClose render={<Button className="w-full" />}>
                        نمایش نتایج
                    </SheetClose>
                    <Button
                        variant="ghost"
                        className="w-full"
                        disabled={activeCount === 0}
                        onClick={clear}>
                        <X />
                        پاک کردن فیلترها
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        {activeCount > 0 &&
            <Button variant="outline" size="icon-xs" onClick={clear}>
                <X />
            </Button>
        }
    </div>
}