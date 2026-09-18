import { Input } from "../ui/input"
import { Button } from "../ui/button"

export function SummaryDayFilter({ day, tab }: { day: string, tab?: string }) {
    return <form className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
        {tab && <input type="hidden" name="tab" value={tab} />}
        <label htmlFor="summary-day" className="text-sm">روز گزارش (تقویم میلادی)</label>
        <Input id="summary-day" type="date" name="day" defaultValue={day} className="w-auto" required />
        <Button type="submit">نمایش</Button>
    </form>
}
