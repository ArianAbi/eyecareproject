export const trafficSessionCookie = 'icn_traffic_session'

export function normalizeReferrerDomain(value: string) {
    try {
        const url = new URL(value)
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
        const domain = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
        if (!domain.includes('.') || /^[\d.]+$/.test(domain) || domain.includes(':')) return null
        return domain || null
    } catch { return null }
}

export function normalizeUtmSource(value: string | null) {
    const source = value?.trim().toLowerCase()
    // Only campaign identifiers, never URLs or arbitrary query contents.
    return source && /^[a-z0-9][a-z0-9._-]{0,79}$/.test(source) ? source : null
}

export function classifyTrafficSource(domain: string | null, utm: string | null) {
    const source = utm ?? domain
    if (!source) return 'direct'
    if (source === 'google' || /^(?:[a-z0-9-]+\.)?google\.(?:com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(source)) return 'google'
    if (['chatgpt', 'chatgpt.com', 'chat.openai.com'].includes(source)) return 'chatgpt'
    if (['bing', 'bing.com', 'www.bing.com'].includes(source)) return 'bing'
    if (['instagram', 'instagram.com', 'l.instagram.com'].includes(source)) return 'instagram'
    if (['telegram', 't.me', 'telegram.org'].includes(source)) return 'telegram'
    return utm ? `utm:${utm}` : `domain:${domain}`
}

export function trafficSourceLabel(source: string) {
    const labels: Record<string, string> = { direct: 'مستقیم / نامشخص', google: 'Google', chatgpt: 'ChatGPT', bing: 'Bing', instagram: 'Instagram', telegram: 'Telegram' }
    return labels[source] ?? source.replace(/^(utm|domain):/, '')
}
