"use server"

import { cookies, headers } from "next/headers"
import { z } from "zod"
import prisma from "../db"
import { requireAdmin } from "../access"
import { parseDateFilterParam } from "../prisma-date-filter"
import { classifyTrafficSource, normalizeReferrerDomain, normalizeUtmSource, trafficSessionCookie } from "../traffic-source"

// Intentionally public: signed-out visitors are included, without account IDs.
export async function TrackTrafficVisitAction(input: { referrerDomain: string | null, utmSource: string | null }) {
    const parsed = z.object({
        referrerDomain: z.string().max(253).regex(/^[a-z0-9.-]+$/).nullable(),
        utmSource: z.string().max(80).nullable(),
    }).safeParse(input)
    if (!parsed.success) return { success: false }
    const cookieStore = await cookies()
    const sessionId = z.string().uuid().safeParse(cookieStore.get(trafficSessionCookie)?.value)
    if (!sessionId.success) return { success: false }
    const requestHeaders = await headers()
    const ownDomain = normalizeReferrerDomain(requestHeaders.get('origin') ?? '')
    const domain = parsed.data.referrerDomain ? normalizeReferrerDomain(`https://${parsed.data.referrerDomain}`) : null
    const referrerDomain = domain === ownDomain ? null : domain
    const utmSource = normalizeUtmSource(parsed.data.utmSource)
    await prisma.trafficVisit.createMany({ data: [{
        sessionId: sessionId.data, source: classifyTrafficSource(referrerDomain, utmSource), referrerDomain, utmSource,
    }], skipDuplicates: true })
    return { success: true }
}

export async function ADMIN_GetTrafficAnalyticsAction(date?: string) {
    await requireAdmin()
    const createdAt = parseDateFilterParam(date)
    const groups = await prisma.trafficVisit.groupBy({
        by: ['source', 'referrerDomain', 'utmSource'], where: { createdAt }, _count: { _all: true },
    })
    const counts = new Map<string, number>()
    let total = 0
    for (const row of groups) {
        counts.set(row.source, (counts.get(row.source) ?? 0) + row._count._all)
        total += row._count._all
    }
    const sources = Array.from(counts, ([source, visits]) => ({ source, visits })).sort((a, b) => b.visits - a.visits || a.source.localeCompare(b.source))
    return { total, sources, rows: groups.map(row => ({ source: row.source, referrerDomain: row.referrerDomain, utmSource: row.utmSource, visits: row._count._all })).sort((a, b) => b.visits - a.visits) }
}
