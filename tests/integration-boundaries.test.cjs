const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load-ts.cjs');
const id = '20000000-0000-4000-8000-000000000001';
const authority = 'A000000000000000000000000000000001';
const quiet = { console: { error() {}, log() {} } };

test('F-15 configuration fails closed; gateway mocks cover HTTP/API failure and duplicate verification', async () => {
  const unconfigured = load('lib/zarinpal.ts', {}, { ...quiet, process: { env: {} }, fetch: () => assert.fail('No request without configuration') });
  await assert.rejects(unconfigured.zarinpalRequestPayment({ amountToman: 1000 }), /not configured/);
  let code = 100, payload, ok = true;
  const gateway = load('lib/zarinpal.ts', {}, { ...quiet, process: { env: { ZARINPAL_MERCHANT_ID: id, ZARINPAL_SANDBOX: 'true' } }, fetch: async (_, options) => { payload = JSON.parse(options.body); assert.ok(options.signal); return { ok, json: async () => ({ data: { code, ref_id: 123, authority } }) }; } });
  assert.equal((await gateway.zarinpalRequestPayment({ amountToman: 1000, description: 'invoice', callbackUrl: 'https://example.test' })).authority, authority);
  assert.equal(payload.amount, 10000);
  for (code of [100, 101]) assert.equal((await gateway.zarinpalVerifyPayment({ authority, amountToman: 1000 })).success, true);
  code = -51; assert.equal((await gateway.zarinpalVerifyPayment({ authority, amountToman: 1000 })).success, false);
  ok = false; await assert.rejects(gateway.zarinpalVerifyPayment({ authority, amountToman: 1000 }), /unavailable/);
});

function paymentDb(initialCredit = 0) {
  const invoice = { id, userId: id, amount: 1000, status: 'PENDING', paymentType: 'CASH', creditAppliedAt: null };
  let credit = initialCredit, audits = 0, queue = Promise.resolve();
  const db = {
    paymentAttempt: { findUnique: async () => ({ authority, invoice: { ...invoice } }), update: async () => {} },
    invoice: { findUniqueOrThrow: async () => ({ ...invoice }), updateMany: async ({ where, data }) => { if (where.status !== invoice.status) return { count: 0 }; Object.assign(invoice, data); return { count: 1 }; }, update: async ({ data }) => { Object.assign(invoice, data); } },
    user: { updateMany: async ({ where, data }) => { if (credit > where.credit.lte) return { count: 0 }; credit += data.credit.increment; return { count: 1 }; } },
    $queryRaw: async () => [],
    $transaction: callback => { const current = queue.then(() => callback(db)); queue = current.catch(() => {}); return current; },
  };
  return { db, invoice, credit: () => credit, setCredit: n => { credit = n; }, audit: async () => { audits++; }, audits: () => audits };
}

test('F-15 concurrent duplicate reconciliation credits once and requires provider proof', async () => {
  const state = paymentDb(); let verified = false;
  const service = load('lib/payment-recovery.ts', { 'lib/db': state.db, 'lib/audit': { writeAudit: state.audit }, 'lib/zarinpal': { zarinpalVerifyPayment: async () => ({ success: verified, refId: '123' }) } }, quiet);
  assert.equal((await service.reconcilePayment(authority)).success, false); assert.equal(state.credit(), 0); assert.equal(state.invoice.status, 'PENDING');
  verified = true;
  const results = await Promise.all([service.reconcilePayment(authority), service.reconcilePayment(authority)]);
  assert.ok(results.every(result => result.success)); assert.equal(state.credit(), 1000); assert.ok(state.invoice.creditAppliedAt); assert.equal(state.audits(), 2);
});

test('F-15 verified payment persists at balance limit and applies later exactly once', async () => {
  const state = paymentDb(2147483647);
  const service = load('lib/payment-recovery.ts', { 'lib/db': state.db, 'lib/audit': { writeAudit: state.audit }, 'lib/zarinpal': { zarinpalVerifyPayment: async () => ({ success: true, refId: '123' }) } }, quiet);
  const result = await service.reconcilePayment(authority);
  assert.equal(result.success, true); assert.equal(result.creditApplied, false); assert.equal(state.invoice.status, 'PAID'); assert.equal(state.invoice.creditAppliedAt, null); assert.equal(state.credit(), 2147483647);
  state.setCredit(100);
  assert.equal(await service.applyInvoiceCredit(id), true); assert.equal(await service.applyInvoiceCredit(id), true); assert.equal(state.credit(), 1100);
});

test('F-15 callback needs no browser session and does not trust browser Status', async () => {
  let seen;
  const route = load('app/(main)/invoices/verify/route.ts', {
    'next/server': { NextResponse: { redirect: url => ({ url: String(url) }) } },
    'lib/payment-recovery': { reconcilePayment: async value => { seen = value; return { success: true, invoiceId: id }; } },
    'lib/rate-limit': { allowOperation: async () => true, requestIdentity: async () => 'ip' },
  });
  const result = await route.GET(new Request('https://example.test/invoices/verify?Authority=' + authority + '&Status=NOK'));
  assert.equal(seen, authority); assert.match(result.url, /payment=success/);
});

test('F-17 private image serving authorizes owner/admin before disk reads and disables public caching', async () => {
  const filename = id + '.webp'; let reads = 0;
  for (const role of ['anonymous', 'stranger', 'owner', 'admin']) {
    const route = load('app/api/images/[filename]/route.ts', {
      'lib/Auth': { auth: async () => role === 'anonymous' ? null : { user: { id } } },
      'lib/db': { user: { findUnique: async () => ({ admin: role === 'admin' }) }, imageAsset: { findFirst: async ({ where }) => { if (role === 'admin') assert.equal(where.ownerId, undefined); else assert.equal(where.ownerId, id); return role === 'stranger' ? null : { filename }; } } },
      'lib/image-storage': { imageStorageDirectory: () => 'H:/test-images' },
      'node:fs/promises': { readFile: async () => { reads++; return Buffer.from('image'); } },
    });
    const response = await route.GET(new Request('https://example.test'), { params: Promise.resolve({ filename }) });
    assert.equal(response.status, role === 'anonymous' ? 401 : role === 'stranger' ? 404 : 200);
    if (response.status === 200) assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  }
  assert.equal(reads, 2);
});

test('F-17/F-18 upload checks quota and limiter before image storage', async () => {
  class InvalidImageError extends Error {}
  let stored = 0;
  for (const scenario of ['rate', 'quota', 'success']) {
    const tx = { $queryRaw: async () => [], imageAsset: { aggregate: async () => ({ _count: scenario === 'quota' ? 100 : 0, _sum: { size: 0 } }), create: async ({ data }) => { assert.equal(data.ownerId, id); } } };
    const action = load('lib/actions/images.action.ts', {
      'lib/Auth': { auth: async () => ({ user: { id } }) }, 'lib/db': { $transaction: async fn => fn(tx) },
      'lib/rate-limit': { allowOperation: async () => scenario !== 'rate' },
      'lib/image-storage': { InvalidImageError, imageStorageDirectory: () => 'H:/test-images', storeImage: async () => { stored++; return { url: '/api/images/' + id + '.webp', size: 10 }; } },
    }, quiet);
    const form = new FormData(); form.set('image', new File([Buffer.from('test')], 'test.png'));
    const result = await action.uploadImageAction(form);
    assert.equal(result.success, scenario === 'success');
  }
  assert.equal(stored, 1);
});

test('F-12 signup rollback never notifies and notification failure does not reverse committed signup', async () => {
  let committed = false, notifyCount = 0;
  for (const rollback of [true, false]) {
    const tx = { user: { create: async ({ data }) => ({ ...data, id }) } };
    const action = load('lib/actions/auth.actions.ts', {
      'lib/db': { user: { findMany: async () => [] }, $transaction: async callback => { const result = await callback(tx); if (rollback) throw Error('rollback'); committed = true; return result; } },
      'lib/rate-limit': { allowOperation: async () => true, requestIdentity: async () => 'ip' },
      'lib/Auth': { signIn: async () => {} }, 'next-auth': { AuthError: class extends Error {} },
      'lib/password': { hashPassword: async () => 'hash' }, 'lib/audit': { writeAudit: async () => {} },
      'lib/bale': { BALE_SendMessage: async () => { assert.equal(committed, true); notifyCount++; return { success: false }; } },
    }, quiet);
    const result = await action.CreateUserAction('username', '09123456789', 'Password123!');
    assert.equal(result.success, !rollback);
  }
  assert.equal(notifyCount, 1);
});


test('F-15 stale authority is replaced only after explicit provider failure', async () => {
  for (const providerStatus of ['IN_BANK', 'UNKNOWN', 'FAILED']) {
    let requests = 0;
    const invoice = { id, userId: id, status: 'PENDING', paymentType: 'CASH', amount: 1000, invoiceNumber: 1, zarinpalAuthority: authority };
    const db = {
      invoice: { findUnique: async () => ({ ...invoice }), findUniqueOrThrow: async () => ({ ...invoice }), updateMany: async () => { invoice.zarinpalAuthority = null; return { count: 1 }; }, update: async ({ data }) => Object.assign(invoice, data) },
      paymentAttempt: { findUniqueOrThrow: async () => ({ authority, createdAt: new Date(0) }), updateMany: async () => ({ count: 1 }), create: async () => {} },
      user: { findUniqueOrThrow: async () => ({ credit: 0 }) }, $queryRaw: async () => [], $transaction: async fn => fn(db),
    };
    const action = load('lib/actions/invoices.action.ts', {
      'lib/db': db, 'lib/access': { requireUser: async () => ({ id }) }, 'lib/audit': { writeAudit: async () => {} }, 'next/cache': { revalidatePath() {} }, 'lib/bale': {},
      'lib/rate-limit': { allowOperation: async () => true }, 'lib/payment-recovery': { reconcilePayment: async () => ({ success: false }) },
      'lib/zarinpal': { paymentUrl: value => value, zarinpalInquiry: async () => providerStatus, zarinpalRequestPayment: async () => { requests++; return { authority: 'new-authority' }; } },
    }, { ...quiet, process: { env: { APP_URL: 'https://example.test' } } });
    const result = await action.PayInvoiceAction(id);
    assert.equal(result.success, providerStatus === 'FAILED'); assert.equal(requests, providerStatus === 'FAILED' ? 1 : 0);
  }
});
