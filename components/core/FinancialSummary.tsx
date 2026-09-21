"use client"

import { useEffect, useRef, useState } from "react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { FinancialAreaChart } from "./financial-area-chart" 
import { FinancialRange,ADMIN_GetFinancialSummaryAction } from "@/lib/actions/admin.summary.action"
// adjust this path to wherever ADMIN_GetFinancialSummaryAction lives


type Summary = Awaited<ReturnType<typeof ADMIN_GetFinancialSummaryAction>>

// Base UI's <SelectValue /> reads the trigger label from the `items` passed to <Select>
const RANGE_ITEMS: { label: string; value: FinancialRange }[] = [
  { label: "امروز", value: "today" },
  { label: "این ماه", value: "this month" },
  { label: "۱۲ ماه اخیر", value: "months" },
  { label: "امسال", value: "this year" },
  { label: "همه زمان‌ها", value: "all time" },
]

export function FinancialSummaryCard({
  initialRange = "this month",
  initialData,
}: {
  initialRange?: FinancialRange
  initialData?: Summary
}) {
  const [range, setRange] = useState<FinancialRange>(initialRange)
  const [data, setData] = useState<Summary | null>(initialData ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const latest = useRef(0) // ignore out-of-order responses when the user switches quickly

  async function load(next: FinancialRange) {
    const id = ++latest.current
    setLoading(true)
    setError(false)
    try {
      const result = await ADMIN_GetFinancialSummaryAction(next)
      if (id === latest.current) setData(result)
    } catch {
      if (id === latest.current) setError(true)
    } finally {
      if (id === latest.current) setLoading(false)
    }
  }

  // fetch on mount only when the server didn't pass initialData
  useEffect(() => {
    if (initialData) return

    const id = ++latest.current
    ADMIN_GetFinancialSummaryAction(initialRange)
      .then((result) => {
        if (id === latest.current) setData(result)
      })
      .catch(() => {
        if (id === latest.current) setError(true)
      })
  }, [initialData, initialRange])

  function onRangeChange(value: FinancialRange | null) {
    if (!value || value === range) return
    setRange(value)
    load(value)
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>خلاصه مالی</CardTitle>
        <CardDescription>پرداخت‌های نقدی و اعتباری تأییدشده</CardDescription>
        <CardAction>
          <Select items={RANGE_ITEMS} value={range} onValueChange={onRangeChange}>
            <SelectTrigger className="w-40" aria-label="بازه زمانی">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {error ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            خطا در دریافت اطلاعات. دوباره تلاش کنید.
          </div>
        ) : data ? (
          <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>
            <FinancialAreaChart series={data.series} bucket={data.bucket} />
          </div>
        ) : (
          <Skeleton className="h-[320px] w-full" />
        )}
      </CardContent>
    </Card>
  )
}
