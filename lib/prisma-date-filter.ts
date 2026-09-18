export function validDay(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function tehranDay(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
}

function midnight(day: string) {
    const utc = new Date(`${day}T00:00:00Z`)
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(utc)
    const minutes = Number(parts.find(p => p.type === "hour")?.value) * 60 + Number(parts.find(p => p.type === "minute")?.value)
    return new Date(utc.getTime() - minutes * 60_000)
}

/** Calendar dates are Tehran business days; the upper bound is exclusive. */
export function parseDateFilterParam(raw: string | null | undefined) {
    if (!raw) return undefined
    try {
        const value = JSON.parse(raw)
        if (!value || !validDay(value.from) || (value.to !== undefined && !validDay(value.to))) return undefined
        const to = value.to ?? value.from
        if (to < value.from) return undefined
        const nextDay = new Date(`${to}T00:00:00Z`)
        nextDay.setUTCDate(nextDay.getUTCDate() + 1)
        return { gte: midnight(value.from), lt: midnight(nextDay.toISOString().slice(0, 10)) }
    } catch { return undefined }
}
