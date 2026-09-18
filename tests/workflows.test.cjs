const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

function actions(file, db = {}, user = { id: 'owner', admin: false }) {
    const prisma = { ...db, $transaction: async fn => fn(prisma) }
    return load(file, {
        '../db': { default: prisma }, '@/lib/db': { default: prisma },
        '../Auth': { auth: async () => user ? { user } : null },
        './Auth': { auth: async () => user ? { user } : null },
        '../access': { requireUser: async () => { if (!user) throw Error('Unauthorized'); return user },
            requireAdmin: async () => { if (!user?.admin) throw Error('Forbidden'); return user } },
        '../audit': { writeAudit: async () => {} },
        'next/cache': { revalidatePath() {} },
        '../zarinpal': { zarinpalVerifyPayment: async () => ({ success: true, refId: 123 }),
            zarinpalRequestPayment: async () => ({ authority: 'authority', paymentUrl: 'https://sandbox.zarinpal.com/pg/StartPay/authority' }) },
    })
}

test('date filters use Tehran business days independent of server timezone', () => {
    const { parseDateFilterParam } = load('lib/prisma-date-filter.ts')
    const range = parseDateFilterParam('{"from":"2026-09-18"}')
    assert.equal(range.gte.toISOString(), '2026-09-17T20:30:00.000Z')
    assert.equal(range.lt.toISOString(), '2026-09-18T20:30:00.000Z')
})
test('malformed, impossible and reversed date filters are ignored', () => {
    const { parseDateFilterParam } = load('lib/prisma-date-filter.ts')
    for (const value of ['oops', '{}', 'null', '{"from":"2026-02-30"}', '{"from":"2026-09-20","to":"2026-09-18"}']) {
        assert.equal(parseDateFilterParam(value), undefined)
    }
})
test('pagination handles malformed, fractional and negative URL values', () => {
    const { PaginationObjectDB } = load('lib/pagination-object.ts')
    for (const page of ['oops', -3, Infinity, 1.5]) assert.equal(PaginationObjectDB(page).skip, 0)
    assert.equal(PaginationObjectDB('3').skip, 20)
})
test('order totals include cutting and delivery charges', () => {
    const { calculateOrderTotal } = load('lib/order-credit.ts')
    assert.equal(calculateOrderTotal({ orderItems: [{ purchasedPrice: 1000, cutPrice: 200 }], deliveryPrice: 50 }), 1250)
})
test('admin order filters reach both list and count queries', async () => {
    const queries = []
    const api = actions('lib/actions/admin.orders.action.ts', {
        user: { findUnique: async () => ({ admin: true }) },
        orderBatch: { findMany: async args => { queries.push(args); return [] }, count: async args => { queries.push(args); return 0 } },
    }, { id: 'admin', admin: true })
    await api.ADMIN_GetOrdersAction({ status: 'PENDING', userId: 'buyer', date: '{"from":"2026-09-18"}', orderNumber: '42' })
    assert.deepEqual(queries[0].where, queries[1].where)
    assert.ok(queries[0].where.createdAt)
    assert.equal(queries[0].where.orederIdentification, 42)
    assert.equal(queries[0].where.userId, 'buyer')
})
test('ordinary users cannot approve invoices or change admin order status', async () => {
    await assert.rejects(actions('lib/actions/admin.invoices.action.ts').ADMIN_ApproveInvoiceAction('invoice'))
    await assert.rejects(actions('lib/actions/admin.orders.action.ts').ADMIN_UpdateOrderStatus({ id: 'order', newStatus: 'SENT' }))
})
test('credit approval accepts waiting status and increments balance only once', async () => {
    let status = 'WAITING_FOR_APPORVAL', credits = 0
    const api = actions('lib/actions/admin.invoices.action.ts', {
        invoice: {
            updateMany: async ({ where, data }) => {
                assert.equal(where.paymentType, 'CREDIT')
                assert.equal(where.status, 'WAITING_FOR_APPORVAL')
                if (status !== where.status) return { count: 0 }
                status = data.status; return { count: 1 }
            },
            findUniqueOrThrow: async () => ({ id: 'invoice', amount: 1000, userId: 'owner' }),
        },
        user: { update: async () => { credits++; return {} } },
    }, { id: 'admin', admin: true })
    await api.ADMIN_ApproveInvoiceAction('invoice')
    await assert.rejects(api.ADMIN_ApproveInvoiceAction('invoice'))
    assert.equal(credits, 1)
})
test('invoice validation rejects fractional, infinite, tiny and out of range amounts', async () => {
    const api = actions('lib/actions/invoices.action.ts', { invoice: { create: async () => assert.fail('invalid write') } })
    for (const amount of [1.5, Infinity, -1, 0, 999, 2147483648]) {
        await assert.rejects(api.CreateInvoiceAction({ amount, paymentType: 'CASH' }))
    }
})
test('payment verification is idempotent and cannot credit twice', async () => {
    let state = 'PENDING', credits = 0
    const api = actions('lib/actions/invoices.action.ts', {
        invoice: {
            findUnique: async () => ({ id: 'invoice', amount: 1000, paymentType: 'CASH', status: state, userId: 'owner', zarinpalAuthority: 'authority' }),
            updateMany: async () => { if (state !== 'PENDING') return { count: 0 }; state = 'PAID'; return { count: 1 } },
        }, user: { update: async () => { credits++ } },
    })
    await api.VerifyInvoicePaymentAction('authority', 'OK')
    await api.VerifyInvoicePaymentAction('authority', 'OK')
    assert.equal(credits, 1)
})
test('payment cancellation cannot credit balance', async () => {
    const api = actions('lib/actions/invoices.action.ts', { invoice: {
        findUnique: async () => ({ id: 'invoice', amount: 1000, paymentType: 'CASH', status: 'PENDING', userId: 'owner' }),
    }, user: { update: async () => assert.fail('unexpected credit') } })
    assert.equal((await api.VerifyInvoicePaymentAction('authority', 'NOK')).success, false)
})
test('ticket creation derives ownership from session and validates empty messages', async () => {
    const api = actions('lib/actions/tickets.action.ts', { ticket: { create: async ({ data }) => {
        assert.equal(data.userId, 'owner'); return { id: 'ticket', ...data }
    } } })
    await assert.rejects(api.CreateTicketAction({ subject: 'help', message: '   ' }))
    assert.equal((await api.CreateTicketAction({ subject: 'help', message: 'question', userId: 'forged' })).data.userId, 'owner')
})
test('ticket replies are conditional on ownership and open status', async () => {
    const api = actions('lib/actions/tickets.action.ts', { ticket: { updateMany: async ({ where }) => {
        assert.equal(where.userId, 'owner'); assert.equal(where.status, 'OPEN'); return { count: 0 }
    } }, ticketMessage: { create: async () => assert.fail('closed or foreign ticket write') } })
    await assert.rejects(api.ReplyTicketAction('ticket', 'reply'))
})
test('admin ticket replies do not trust a client admin flag', async () => {
    const api = actions('lib/actions/tickets.action.ts')
    await assert.rejects(api.ADMIN_ReplyTicketAction('ticket', 'reply'))
})
test('user order filters always preserve ownership and requested page', async () => {
    const api = actions('lib/actions/orders.action.ts', { orderBatch: {
        findMany: async args => { assert.equal(args.where.userId, 'owner'); assert.equal(args.skip, 20); assert.equal(args.where.status, 'SENT'); return [] },
        count: async args => { assert.equal(args.where.userId, 'owner'); return 0 },
    } })
    await api.GetOrdersAction({ page: 3, status: 'SENT' })
})

test('summaries and audit logs deny non-admin callers', async () => {
    const api = actions('lib/actions/admin.summary.action.ts')
    await assert.rejects(api.ADMIN_GetSummaryAction('2026-09-18'))
    await assert.rejects(actions('lib/actions/admin.logs.action.ts').ADMIN_GetLogsAction({}))
})

test('audit records store explicit event details without capturing payloads', async () => {
    const { writeAudit } = load('lib/audit.ts')
    let record
    await writeAudit({ auditLog: { create: async args => { record = args.data } } }, 'actor', 'TICKET_CREATED', 'Ticket', 'ticket')
    assert.deepEqual(record, { actorId: 'actor', action: 'TICKET_CREATED', entityType: 'Ticket', entityId: 'ticket', detail: undefined })
})
