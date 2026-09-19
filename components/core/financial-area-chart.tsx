"use client"

import { useId } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export type Bucket = "hour" | "day" | "month"
// keys: hour -> 'HH', day -> 'YYYY-MM-DD' (Jalali), month -> 'YYYY-MM' (Jalali)
export type SeriesPoint = { key: string; cash: number; credit: number }

const chartConfig = {
  cash: { label: "نقدی", color: "var(--chart-1)" },
  credit: { label: "اعتباری", color: "var(--chart-2)" },
} satisfies ChartConfig

const MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
]

const faNum = new Intl.NumberFormat("fa-IR", { useGrouping: false })
const faHour = new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2, useGrouping: false })
const faMoney = new Intl.NumberFormat("fa-IR")
const faCompact = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 })

function formatKey(bucket: Bucket, key: string, opts: { full?: boolean; showYear?: boolean } = {}) {
  if (bucket === "hour") {
    const time = `${faHour.format(Number(key))}:${faHour.format(0)}`
    return opts.full ? `ساعت ${time}` : time
  }
  const [y, m, d] = key.split("-").map(Number)
  if (bucket === "day") {
    const base = `${faNum.format(d)} ${MONTHS[m - 1]}`
    return opts.full ? `${base} ${faNum.format(y)}` : base
  }
  const base = MONTHS[m - 1]
  return opts.full || opts.showYear ? `${base} ${faNum.format(y)}` : base
}

export function FinancialAreaChart({
  series,
  bucket,
  className,
}: {
  series: SeriesPoint[]
  bucket: Bucket
  className?: string
}) {
  // unique gradient ids so several charts can live on one page
  const id = useId().replace(/:/g, "")
  const fillCash = `fill-cash-${id}`
  const fillCredit = `fill-credit-${id}`

  // month ticks only need the year when the range crosses a year boundary (e.g. "all time")
  const showYear =
    bucket === "month" &&
    series.length > 1 &&
    series[0].key.slice(0, 4) !== series[series.length - 1].key.slice(0, 4)

  return (
    <ChartContainer config={chartConfig} className={cn("aspect-auto h-[320px] w-full", className)}>
      <AreaChart accessibilityLayer data={series} margin={{ left: 4, right: 12 }}>
        <defs>
          <linearGradient id={fillCash} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-cash)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-cash)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id={fillCredit} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-credit)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-credit)" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} />

        <XAxis
          dataKey="key"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(key: string) => formatKey(bucket, key, { showYear })}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(value: number) => faCompact.format(value)}
        />

        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) => {
                const key = payload?.[0]?.payload?.key as string | undefined
                return key ? formatKey(bucket, key, { full: true }) : null
              }}
              formatter={(value, name) => {
                const item = chartConfig[String(name) as keyof typeof chartConfig]
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: `var(--color-${String(name)})` }}
                      />
                      {item?.label ?? String(name)}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {faMoney.format(Number(value))} تومان
                    </span>
                  </div>
                )
              }}
            />
          }
        />

        {/* stacked, so the top edge of the chart is cash + credit */}
        <Area
          dataKey="credit"
          type="monotone"
          fill={`url(#${fillCredit})`}
          stroke="var(--color-credit)"
          stackId="a"
        />
        <Area
          dataKey="cash"
          type="monotone"
          fill={`url(#${fillCash})`}
          stroke="var(--color-cash)"
          stackId="a"
        />

        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
