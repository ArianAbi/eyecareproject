const test = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load-ts.cjs')

const owner = '20000000-0000-4000-8000-000000000001'
const target = '20000000-0000-4000-8000-000000000002'

test('customer PDF endpoint only exports the signed-in account', async () => {
  let exported
  const make = user => load('app/api/financial/print/route.ts', {
    'lib/Auth': { auth: async () => user ? { user: { id: user } } : null },
    'lib/credit-statement': { createCreditStatementResponse: async id => { exported = id; return new Response('pdf') } },
  })
  assert.equal((await make(null).GET()).status, 401)
  assert.equal(exported, undefined)
  assert.equal((await make(owner).GET()).status, 200)
  assert.equal(exported, owner)
})

test('admin PDF endpoint checks current database role before selecting another user', async () => {
  let exported
  const make = (user, admin) => load('app/api/admin/users/[id]/financial/print/route.ts', {
    'lib/Auth': { auth: async () => user ? { user: { id: user } } : null },
    'lib/db': { user: { findUnique: async () => ({ admin }) } },
    'lib/credit-statement': { createCreditStatementResponse: async id => { exported = id; return new Response('pdf') } },
  })
  const request = new Request('https://example.test')
  const context = { params: Promise.resolve({ id: target }) }
  assert.equal((await make(null, false).GET(request, context)).status, 401)
  assert.equal((await make(owner, false).GET(request, context)).status, 403)
  assert.equal(exported, undefined)
  assert.equal((await make(owner, true).GET(request, { params: Promise.resolve({ id: 'bad' }) })).status, 404)
  assert.equal((await make(owner, true).GET(request, context)).status, 200)
  assert.equal(exported, target)
})


test('PDF export loads every transaction in batches and returns a private A4 download', async () => {
  const entries = Array.from({ length: 260 }, (_, i) => ({
    id: String(i), createdAt: new Date('2026-09-01T12:00:00Z'),
    description: 'هزینه سفارش', amount: -100, balanceAfter: 1000 - i * 100,
  }))
  const calls = []
  const db = {
    user: { findUnique: async ({ where }) => where.id === owner ? { username: 'owner', storeName: '', credit: 1000 } : null },
    creditTransaction: { findMany: async query => {
      assert.equal(query.where.userId, owner)
      calls.push(query)
      const start = query.cursor ? entries.findIndex(row => row.id === query.cursor.id) + 1 : 0
      return entries.slice(start, start + query.take)
    } },
  }
  const { createCreditStatementResponse } = load('lib/credit-statement.ts', { 'lib/db': db })
  const response = await createCreditStatementResponse(owner)
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.equal(response.headers.get('Content-Type'), 'application/pdf')
  assert.match(response.headers.get('Content-Disposition'), /attachment/)
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
  assert.equal(calls.length, 2)
  assert.equal(calls[1].cursor.id, '249')
})
