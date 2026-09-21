"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { TrackTrafficVisitAction } from "@/lib/actions/analytics.actions"
import { normalizeReferrerDomain, normalizeUtmSource, trafficSessionCookie } from "@/lib/traffic-source"

let recorded = false
let inFlight: Promise<unknown> | null = null
let entry: { referrerDomain: string | null, utmSource: string | null } | null = null

export function TrafficTracker() {
    const pathname = usePathname()
    useEffect(() => {
        if (pathname === '/admin' || pathname.startsWith('/admin/') || recorded || inFlight) return
        // Capture first-touch attribution before any client-side navigation.
        entry ??= {
            referrerDomain: normalizeReferrerDomain(document.referrer),
            utmSource: normalizeUtmSource(new URLSearchParams(window.location.search).get('utm_source')),
        }
        try {
            const existing = document.cookie.split('; ').find(cookie => cookie.startsWith(`${trafficSessionCookie}=`))?.split('=')[1]
            if (!existing || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) {
                document.cookie = `${trafficSessionCookie}=${crypto.randomUUID()}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
            }
            // Session cookie has no expiry: shared across tabs, reloads and login.
            if (!document.cookie.includes(`${trafficSessionCookie}=`)) return
            inFlight = TrackTrafficVisitAction(entry).then(result => { recorded = result.success }).catch(() => {
                // Analytics must never interrupt browsing; retry on the next navigation.
            }).finally(() => { inFlight = null })
        } catch { /* Cookies may be disabled; browsing still works. */ }
    }, [pathname])
    return null
}
