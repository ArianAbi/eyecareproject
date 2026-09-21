"use client"

import { Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { trafficSourceLabel } from "@/lib/traffic-source"

export function TrafficSourceChart({ sources }: { sources: { source: string, visits: number }[] }) {
    if (!sources.length) return <div className="grid min-h-72 place-items-center text-sm text-muted-foreground">در این بازه بازدیدی ثبت نشده است.</div>
    const visible = sources.slice(0, 5).map(item => ({ label: trafficSourceLabel(item.source), visits: item.visits }))
    const remaining = sources.slice(5).reduce((sum, item) => sum + item.visits, 0)
    if (remaining) visible.push({ label: 'سایر منابع', visits: remaining })
    const config: ChartConfig = { visits: { label: 'بازدید' } }
    const data = visible.map((item, index) => {
        // Fixed keys keep externally supplied source names out of generated CSS.
        const key = `source${index}`
        config[key] = { label: item.label, color: index < 5 ? `var(--chart-${index + 1})` : 'var(--muted-foreground)' }
        return { source: key, visits: item.visits, fill: `var(--color-${key})` }
    })
    return <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-md" initialDimension={{ width: 360, height: 360 }}>
        <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="source" />} />
            <Pie data={data} dataKey="visits" nameKey="source" outerRadius="75%" />
            <ChartLegend content={<ChartLegendContent nameKey="source" className="flex-wrap gap-x-4 gap-y-2" />} />
        </PieChart>
    </ChartContainer>
}
