const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

function load(path, dependencies = {}) {
    const exports = {}
    const compiled = ts.transpileModule(readFileSync(join(__dirname, path), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    new Function('require', 'exports', compiled)(name => {
        assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
        return dependencies[name]
    }, exports)
    return exports
}
const attribution = load('../traffic-source.ts')
const dateFilter = load('../prisma-date-filter.ts')
const session = '00000000-0000-4000-8000-000000000001'

function setup({ admin = false, cookie = session, groups = [] } = {}) {
    const visits = new Map()
    let filter
    const actions = load('analytics.actions.ts', {
        'next/headers': { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }), headers: async () => new Headers({ origin: 'https://www.example.com' }) },
        zod: require('zod'), '../traffic-source': attribution, '../prisma-date-filter': dateFilter,
        '../access': { requireAdmin: async () => { if (!admin) throw Error('Forbidden') } },
        '../db': { default: { trafficVisit: {
            createMany: async ({ data, skipDuplicates }) => {
                assert.equal(skipDuplicates, true)
                for (const row of data) if (!visits.has(row.sessionId)) visits.set(row.sessionId, row)
            },
            groupBy: async ({ where }) => { filter = where; return groups },
        } } },
    })
    return { actions, visits, getFilter: () => filter }
}

test('referrers retain only normalized domains, not paths, queries or IPs', () => {
    assert.equal(attribution.normalizeReferrerDomain('https://www.google.com/search?q=private#fragment'), 'google.com')
    for (const value of ['', 'invalid', 'javascript:alert(1)', 'https://127.0.0.1/path', 'http://[::1]/', 'http://localhost/']) assert.equal(attribution.normalizeReferrerDomain(value), null)
})

test('Google and ChatGPT aliases classify correctly and UTM takes precedence', () => {
    for (const domain of ['google.com', 'google.co.uk', 'google.de', 'images.google.com']) assert.equal(attribution.classifyTrafficSource(domain, null), 'google')
    for (const domain of ['chatgpt.com', 'chat.openai.com']) assert.equal(attribution.classifyTrafficSource(domain, null), 'chatgpt')
    assert.equal(attribution.classifyTrafficSource('google.com', 'chatgpt'), 'chatgpt')
    assert.equal(attribution.classifyTrafficSource('google.com.evil.com', null), 'domain:google.com.evil.com')
    assert.equal(attribution.classifyTrafficSource(null, null), 'direct')
    assert.equal(attribution.normalizeUtmSource(' ChatGPT '), 'chatgpt')
    assert.equal(attribution.normalizeUtmSource('https://example.com/private?token=secret'), null)
    assert.equal(attribution.normalizeUtmSource('x'.repeat(81)), null)
})

test('anonymous sessions are counted once and keep first-touch attribution', async () => {
    const { actions, visits } = setup()
    await actions.TrackTrafficVisitAction({ referrerDomain: 'google.com', utmSource: null })
    await actions.TrackTrafficVisitAction({ referrerDomain: 'chatgpt.com', utmSource: 'chatgpt' })
    assert.equal(visits.size, 1)
    assert.deepEqual(visits.get(session), { sessionId: session, source: 'google', referrerDomain: 'google.com', utmSource: null })
})

test('self referrals become direct and malformed inputs never write', async () => {
    const { actions, visits } = setup()
    await actions.TrackTrafficVisitAction({ referrerDomain: 'www.example.com', utmSource: null })
    assert.equal(visits.get(session).source, 'direct')
    const invalid = setup()
    await invalid.actions.TrackTrafficVisitAction({ referrerDomain: 'https://google.com/private', utmSource: null })
    assert.equal(invalid.visits.size, 0)
    for (const cookie of [null, 'invalid']) {
        const missing = setup({ cookie })
        await missing.actions.TrackTrafficVisitAction({ referrerDomain: null, utmSource: null })
        assert.equal(missing.visits.size, 0)
    }
})

test('analytics reports require admin access', async () => {
    await assert.rejects(setup().actions.ADMIN_GetTrafficAnalyticsAction(), /Forbidden/)
})

test('reports aggregate source aliases and use inclusive Tehran date ranges', async () => {
    const { actions, getFilter } = setup({ admin: true, groups: [
        { source: 'google', referrerDomain: 'google.com', utmSource: null, _count: { _all: 3 } },
        { source: 'google', referrerDomain: 'google.co.uk', utmSource: null, _count: { _all: 2 } },
        { source: 'direct', referrerDomain: null, utmSource: null, _count: { _all: 1 } },
    ] })
    const report = await actions.ADMIN_GetTrafficAnalyticsAction(JSON.stringify({ from: '2026-09-21', to: '2026-09-21' }))
    assert.equal(report.total, 6)
    assert.deepEqual(report.sources, [{ source: 'google', visits: 5 }, { source: 'direct', visits: 1 }])
    assert.equal(getFilter().createdAt.gte.toISOString(), '2026-09-20T20:30:00.000Z')
    assert.equal(getFilter().createdAt.lt.toISOString(), '2026-09-21T20:30:00.000Z')
    assert.deepEqual((await setup({ admin: true }).actions.ADMIN_GetTrafficAnalyticsAction()).sources, [])
})
