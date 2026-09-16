import { startOfDay, endOfDay } from "date-fns"
import { DateFilterValue } from "@/components/core/DateFilter"

/** JSON param -> Prisma DateTime filter. Single-day selection becomes a full-day range. */
export function parseDateFilterParam(raw: string | null | undefined) {
  if (!raw) return undefined
  try {
    const { from, to } = JSON.parse(raw) as DateFilterValue
    return {
      gte: startOfDay(new Date(from)),
      lte: endOfDay(new Date(to ?? from)),
    }
  } catch {
    return undefined
  }
}