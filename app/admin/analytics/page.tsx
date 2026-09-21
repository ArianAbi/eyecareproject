import type { Metadata } from "next"
import { ADMIN_GetTrafficAnalyticsAction } from "@/lib/actions/analytics.actions"
import { trafficSourceLabel } from "@/lib/traffic-source"
import { parseDateFilterParam } from "@/lib/prisma-date-filter"
import { QueryFilters } from "@/components/core/QueryFilters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrafficSourceChart } from "./TrafficSourceChart"

export const metadata: Metadata = { title: 'آمار ورودی سایت' }

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const params = await searchParams
    const data = await ADMIN_GetTrafficAnalyticsAction(params.date)
    const direct = data.sources.find(item => item.source === 'direct')?.visits ?? 0
    const range = parseDateFilterParam(params.date)
    const date = (value: Date) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' }).format(value)
    const rangeLabel = range ? `${date(range.gte)} تا ${date(new Date(range.lt.getTime() - 1))}` : 'همه زمان‌ها'
    return <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="space-y-1"><h1 className="text-xl font-semibold">آمار ورودی سایت</h1><p className="text-sm text-muted-foreground">{rangeLabel}</p></div><QueryFilters /></div>
        <div className="grid gap-3 sm:grid-cols-3">
            {[['کل بازدیدها', data.total], ['ورودی از منابع مشخص', data.total - direct], ['مستقیم / نامشخص', direct]].map(([label, value]) => <Card key={label}><CardHeader><CardDescription>{label}</CardDescription></CardHeader><CardContent className="text-2xl font-semibold">{Number(value).toLocaleString('fa-IR')}</CardContent></Card>)}
        </div>
        <Card><CardHeader><CardTitle>سهم منابع ورودی</CardTitle><CardDescription>پنج منبع اصلی؛ باقی منابع در «سایر منابع» نمایش داده می‌شوند.</CardDescription></CardHeader><CardContent><TrafficSourceChart sources={data.sources} /></CardContent></Card>
        <Card><CardHeader><CardTitle>جزئیات منابع</CardTitle><CardDescription>در لینک‌های دارای UTM، مقدار utm_source برای تعیین منبع اولویت دارد.</CardDescription></CardHeader><CardContent>
            <div className="rounded-lg border"><Table><TableHeader><TableRow><TableHead>منبع</TableHead><TableHead>دامنه ارجاع‌دهنده</TableHead><TableHead>UTM source</TableHead><TableHead>بازدید</TableHead><TableHead>سهم از کل</TableHead></TableRow></TableHeader><TableBody>
                {data.rows.map(row => <TableRow key={JSON.stringify([row.source, row.referrerDomain, row.utmSource])}><TableCell>{trafficSourceLabel(row.source)}</TableCell><TableCell dir="ltr" className="max-w-64 whitespace-normal break-all">{row.referrerDomain || '—'}</TableCell><TableCell dir="ltr" className="max-w-48 whitespace-normal break-all">{row.utmSource || '—'}</TableCell><TableCell>{row.visits.toLocaleString('fa-IR')}</TableCell><TableCell>{new Intl.NumberFormat('fa-IR', { style: 'percent', maximumFractionDigits: 1 }).format(row.visits / data.total)}</TableCell></TableRow>)}
                {!data.rows.length && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">در این بازه بازدیدی ثبت نشده است.</TableCell></TableRow>}
            </TableBody></Table></div>
        </CardContent></Card>
        <p className="text-xs leading-6 text-muted-foreground">هر نشست مرورگر یک بار شمرده می‌شود؛ ورود به حساب، تغییر صفحه و بارگذاری مجدد، بازدید جدید نیست. صفحات مدیریت شمرده نمی‌شوند. در صورت مخفی بودن ارجاع‌دهنده یا نبود UTM، منبع «مستقیم / نامشخص» است. این آمار از زمان فعال‌سازی ثبت می‌شود و تعداد افراد یکتا نیست.</p>
    </div>
}
