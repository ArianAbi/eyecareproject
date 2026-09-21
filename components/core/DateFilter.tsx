"use client"

import { parseDateFilterParam } from "@/lib/prisma-date-filter"
import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { format as formatGregorian } from "date-fns"
import { format as formatJalali } from "date-fns-jalali"
import { DateRange } from "react-day-picker"
import { CalendarIcon, XIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface DateFilterValue {
  from: string // "yyyy-MM-dd"
  to?: string  // "yyyy-MM-dd" — present only when the range checkbox was on
}

export function DateFilter({
  initialValue,
  onSelect,
  paramKey,
  placeholder = "انتخاب تاریخ",
  label = "تاریخ",
  disabled = false,
}: {
  initialValue?: string // JSON.stringify(DateFilterValue), read back from the URL
  onSelect?: (value: DateFilterValue | null) => void
  paramKey?: string
  placeholder?: string
  label?: string
  disabled?: boolean
}) {
  const parsedInitial: DateFilterValue | null = initialValue && parseDateFilterParam(initialValue)
    ? JSON.parse(initialValue)
    : null

  const [open, setOpen] = useState(false)
  // Reopening a previous range selection starts the checkbox checked.
  const [isRange, setIsRange] = useState(Boolean(parsedInitial?.to))
  const [single, setSingle] = useState<Date | undefined>(
    parsedInitial ? new Date(`${parsedInitial.from}T00:00:00`) : undefined
  )
  const [range, setRange] = useState<DateRange | undefined>(
    parsedInitial
      ? {
        from: new Date(`${parsedInitial.from}T00:00:00`),
        to: parsedInitial.to ? new Date(`${parsedInitial.to}T00:00:00`) : undefined,
      }
      : undefined
  )

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  function toISODate(date: Date) {
    return formatGregorian(date, "yyyy-MM-dd")
  }

  function commit(value: DateFilterValue | null) {
    if (paramKey) {
      const params = new URLSearchParams(searchParams.toString())
      for (const page of ["page", "pendingPage", "restPage"]) params.delete(page)
      if (value) params.set(paramKey, JSON.stringify(value))
      else params.delete(paramKey)
      router.push(`${pathname}?${params.toString()}`)
    }
    onSelect?.(value)
  }

  function clear() {
    setSingle(undefined)
    setRange(undefined)
    commit(null)
  }

  // Carries the current pick across the single <-> range toggle instead of
  // dropping it, so switching the checkbox doesn't silently lose what's selected.
  function toggleRange(checked: boolean) {
    setIsRange(checked)
    if (checked) {
      const from = single ?? range?.from
      setRange(from ? { from, to: undefined } : undefined)
      if (from) commit({ from: toISODate(from) }) // still a single day until `to` is picked
    } else {
      const from = range?.from ?? single
      setSingle(from)
      if (from) commit({ from: toISODate(from) })
      else commit(null)
    }
  }

  const hasValue = isRange ? Boolean(range?.from) : Boolean(single)

  const displayLabel = !hasValue
    ? placeholder
    : isRange
      ? range?.to
        ? `${formatJalali(range.from!, "d MMMM")} – ${formatJalali(range.to, "d MMMM yyyy")}`
        : formatJalali(range!.from!, "d MMMM yyyy")
      : formatJalali(single!, "d MMMM yyyy")

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">
        <span>{label}</span>
        {hasValue && (
          <button
            onClick={clear}
            className="border size-4 grid place-items-center hover:bg-white/20 rounded-full"
          >
            <XIcon size={12} />
          </button>
        )}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            buttonVariants({ variant: 'default' }),
            "justify-start text-right font-normal text-xs",
          )}
        >
          <CalendarIcon className="ms-2 size-3.5" />
          {displayLabel}
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Checkbox
              checked={isRange}
              onCheckedChange={(value) => toggleRange(!!value)}
              id="date-filter-range-toggle"
            />
            <Label htmlFor="date-filter-range-toggle" className="text-xs cursor-pointer">
              بازه زمانی
            </Label>
          </div>

          {isRange ? (
            <Calendar
              mode="range"
              selected={range}
              numberOfMonths={2}
              onSelect={(next) => {
                setRange(next)
                if (next?.from && next?.to) {
                  commit({ from: toISODate(next.from), to: toISODate(next.to) })
                  // setOpen(false)
                } else if (!next) {
                  commit(null)
                }
                // only `from` picked so far — leave open for `to`
              }}
            />
          ) : (
            <Calendar
              mode="single"
              selected={single}
              onSelect={(date) => {
                setSingle(date)
                if (date) {
                  commit({ from: toISODate(date) })
                  setOpen(false)
                } else {
                  commit(null)
                }
              }}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}