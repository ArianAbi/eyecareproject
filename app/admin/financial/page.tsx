import { FinancialSummary } from "@/components/core/FinancialSummary"
import { SummaryDayFilter } from "@/components/core/SummaryDayFilter"
import { tehranDay, validDay } from "@/lib/prisma-date-filter"

export default async function FinancialPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
    const params = await searchParams
    const day = validDay(params.day) ? params.day : tehranDay()
    return <div className="space-y-5"><h1 className="text-xl font-semibold">گزارش مالی</h1><SummaryDayFilter day={day} /><FinancialSummary day={day} /></div>
}
