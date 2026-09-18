import { ADMIN_GetFinancialSummaryAction } from "@/lib/actions/admin.summary.action"
import { Card, CardContent } from "../ui/card"

export async function FinancialSummary({ day }: { day?: string }) {
    const data = await ADMIN_GetFinancialSummaryAction(day)
    const max = Math.max(1, ...data.series.map(row => Math.max(row.cash, row.credit)))
    return <div className="space-y-5">
        <p className="text-sm text-muted-foreground">۱۴ روز منتهی به روز انتخاب‌شده؛ پرداخت نقدی و اعتبار تاییدشده جداگانه نمایش داده می‌شوند. همه مبالغ به تومان است.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
            ['پرداخت نقدی تاییدشده', data.cashTotal], ['اعتبار تاییدشده', data.creditTotal],
            ['درخواست اعتبار در انتظار (همه روزها)', data.pendingAmount], ['موجودی فعلی کاربران', data.totalBalance],
        ].map(([label, value]) => <Card key={label}><CardContent className="space-y-2 pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold">{Number(value).toLocaleString('fa-IR')}</p></CardContent></Card>)}</div>
        <div className="rounded-lg border p-4"><h2 className="mb-4 font-semibold">روند پرداخت و اعتبار</h2>
            <p className="mb-4 text-xs"><span className="text-emerald-500">■ نقدی</span> · <span className="text-blue-500">■ اعتبار</span></p>
            <div className="space-y-3">{data.series.map(row => <div key={row.day} className="grid grid-cols-[5rem_1fr] items-center gap-3 text-xs">
                <span>{new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(new Date(`${row.day}T12:00:00Z`))}</span>
                <div className="space-y-1">
                    <div className="flex items-center gap-2"><div className="h-2 min-w-px rounded bg-emerald-500" style={{ width: `${row.cash / max * 65}%` }} /><span>نقدی {row.cash.toLocaleString('fa-IR')}</span></div>
                    <div className="flex items-center gap-2"><div className="h-2 min-w-px rounded bg-blue-500" style={{ width: `${row.credit / max * 65}%` }} /><span>اعتبار {row.credit.toLocaleString('fa-IR')}</span></div>
                </div>
            </div>)}</div>
        </div>
    </div>
}
