const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load-ts.cjs');
const id = '20000000-0000-4000-8000-000000000001';
const other = '20000000-0000-4000-8000-000000000002';
const quiet = { console: { error() {}, log() {} } };
const lens = { positiveFromSph: '0.00', positivToSph: '4.00', negativeFromSph: '0.00', negativeToSph: '-4.00', fromCyl: '0.00', toCyl: '-2.00' };
const eye = { sph: '1.00', cyl: '-1.00', aux: '90' };
const item = { id, od: eye, os: eye, odOnly: false, rawOrCut: false };
const product = { id, active: true, type: 'LENS', lens, price: 101, name: 'Lens name', includesGuarantee: false, includesBag: true, includesCleaningCloth: false, includesCleaningSpray: false, categoryRel: { name: 'Category', color: 'blue' } };
const prescription = { odSph: eye.sph, odCyl: eye.cyl, odAux: eye.aux, osSph: eye.sph, osCyl: eye.cyl, osAux: eye.aux, odOnly: true, rawOrCut: 'RAW', productId: id, product, guaranteeClientName: '' };
const auth = { auth: async () => ({ user: { id, username: 'owner' } }) };
const access = { requireAdmin: async () => ({ id }), requireUser: async () => ({ id, username: 'owner' }) };
function deps(db, extra = {}) { return { 'lib/db': db, 'lib/Auth': auth, 'lib/access': access, 'lib/audit': { writeAudit: async () => {} }, 'next/cache': { revalidatePath() {} }, 'lib/bale': { BALE_SendMessage: async () => ({ success: false }) }, 'generated/prisma/client': { Prisma: { PrismaClientKnownRequestError: class extends Error {} } }, ...extra }; }

test('F-01/F-03 eligibility truth table, malformed powers/axis, account and product rules', () => {
  const { lensEligible, assertOrderEligibility } = load('lib/lens-policy.ts');
  for (const od of [true, false]) for (const os of [true, false]) for (const odOnly of [true, false]) {
    const input = { od: { ...eye, sph: od ? '1.00' : '9.00' }, os: { ...eye, sph: os ? '1.00' : '9.00' }, odOnly };
    assert.equal(lensEligible(lens, input), od && (odOnly || os));
  }
  for (const value of ['NaN', 'Infinity', '1junk', '', '1.13']) assert.equal(lensEligible(lens, { ...item, od: { ...eye, sph: value } }), false);
  assert.equal(lensEligible(lens, { ...item, od: { ...eye, aux: '181' } }), false);
  for (const status of ['UNVERIFIED', 'WAITING_FOR_APPROVAL', 'REJECTED']) assert.throws(() => assertOrderEligibility(status, product, item));
  for (const change of [{ active: false }, { type: 'FRAME' }, { lens: null }]) assert.throws(() => assertOrderEligibility('VERIFIED', { ...product, ...change }, item));
});

test('F-01/F-06/F-10 both checkout actions recheck eligibility, debit rounded total and reject delivery tampering', async () => {
  for (const admin of [false, true]) for (const scenario of ['ok', 'unverified', 'inactive', 'range', 'type', 'delivery']) {
    let created, debit = 0, cleared = false;
    const cartProduct = { ...product, active: scenario !== 'inactive', type: scenario === 'type' ? 'FRAME' : 'LENS' };
    const row = { ...prescription, product: cartProduct, odSph: scenario === 'range' ? '9.00' : '1.00' };
    const tx = {
      user: { findUniqueOrThrow: async () => ({ userStatus: scenario === 'unverified' ? 'UNVERIFIED' : 'VERIFIED', credit: 102 }), updateMany: async ({ where, data }) => { assert.equal(where.credit.gte, 102); debit += data.credit.decrement; return { count: 1 }; } },
      cart: { findUnique: async () => ({ id, cartItems: [row, row] }) },
      cartItem: { deleteMany: async () => { cleared = true; } },
      orderBatch: { create: async ({ data }) => { created = data; return { ...data, id, orderItems: [row, row] }; } },
    };
    const db = { $transaction: async fn => fn(tx), orderBatch: { count: async () => 1 } };
    const action = load(admin ? 'lib/actions/admin.cart.actions.ts' : 'lib/actions/cart.actions.ts', deps(db), quiet);
    const input = { customerNote: '', deliveryPrice: scenario === 'delivery' ? 1 : 0 };
    const result = await (admin ? action.ADMIN_SubmitCartOrderAction(id, input) : action.SubmitCartOrderAction(input));
    assert.equal(result.success, scenario === 'ok');
    if (scenario === 'ok') { assert.equal(debit, 102); assert.equal(created.creditCharged, 102); assert.equal(created.orderItems.create[0].purchasedPrice, 51); assert.equal(created.orderItems.create[0].cutPrice, 0); assert.equal(cleared, true); }
    else { assert.equal(debit, 0); assert.equal(created, undefined); assert.equal(cleared, false); }
  }
});

test('F-01 direct cart additions reject unverified and disabled products before writes', async () => {
  for (const admin of [true, false]) for (const scenario of ['unverified', 'inactive', 'malformed']) {
    let writes = 0;
    const tx = { user: { findUniqueOrThrow: async () => ({ userStatus: scenario === 'unverified' ? 'UNVERIFIED' : 'VERIFIED' }) }, product: { findUnique: async () => ({ ...product, active: scenario !== 'inactive' }) }, cart: { upsert: async () => { writes++; return { id }; } } };
    const action = load(admin ? 'lib/actions/admin.cart.actions.ts' : 'lib/actions/cart.actions.ts', deps({ $transaction: async fn => fn(tx) }), quiet);
    const input = scenario === 'malformed' ? { ...item, od: { ...eye, aux: '-5' } } : item;
    const result = await (admin ? action.ADMIN_AddItemToCartAction(id, input) : action.AddItemToCartAction(input));
    assert.equal(result.success, false); assert.equal(writes, 0);
  }
});

test('F-02/F-05 profile response never returns user/password, state guard and audit are transactional', async () => {
  for (const status of ['UNVERIFIED', 'REJECTED', 'VERIFIED', 'WAITING_FOR_APPROVAL']) {
    let audited = 0, notified = 0, saved;
    const allowed = ['UNVERIFIED', 'REJECTED'].includes(status);
    const tx = { user: { updateMany: async ({ where, data }) => { assert.deepEqual(where.userStatus.in, ['UNVERIFIED', 'REJECTED']); if (allowed) saved = data; return { count: allowed ? 1 : 0 }; } } };
    const action = load('lib/actions/profile.action.ts', deps({ $transaction: async fn => fn(tx) }, { 'lib/audit': { writeAudit: async () => { audited++; } }, 'lib/bale': { BALE_SendMessage: async () => { notified++; } } }), quiet);
    const result = await action.SaveProfileInfoAction({ nationalCode: '1234567890', managementName: '  Owner  ', address: 'Store address' });
    assert.equal(result.success, allowed); assert.equal(audited, +allowed); assert.equal(notified, +allowed); assert.equal('data' in result, false); assert.equal('password' in result, false);
    if (allowed) assert.equal(saved.managementName, 'Owner');
  }
  const action = load('lib/actions/profile.action.ts', deps({ $transaction: async () => assert.fail('Invalid input must not transact') }), quiet);
  for (const bad of [{ nationalCode: 'abcdefghij' }, { managementName: 'a'.repeat(101) }, { address: 'a'.repeat(1001) }]) assert.equal((await action.SaveProfileInfoAction({ nationalCode: '1234567890', managementName: 'Owner', address: 'Store address', ...bad })).success, false);
});

test('F-07 strict product schema rejects arbitrary scalars and invalid range ordering', () => {
  const { productSchema } = load('lib/schemas/product.ts');
  const input = { name: 'Lens', description: 'Details', active: false, price: 101, type: 'LENS', categoryId: id, tagIds: [], includesGuarantee: false, includesBag: false, includesSpray: false, includesCloth: false, lens };
  assert.equal(productSchema.parse(input).active, false);
  for (const patch of [{ price: -1 }, { name: 'a' }, { categoryId: 'bad' }, { unexpected: true }, { lens: { ...lens, positiveFromSph: '5', positivToSph: '1' } }]) assert.equal(productSchema.safeParse({ ...input, ...patch }).success, false);
});

test('F-07/F-08 product creation respects active false; deletion derives relation and archives references', async () => {
  let data, removed;
  const tx = { subCategory: { findUniqueOrThrow: async () => ({ masterCategory: { type: 'LENS' } }) }, product: { create: async input => { data = input.data; return { ...data, id }; } }, lens: { create: async () => {} } };
  const action = load('lib/actions/admin.products.action.ts', deps({ $transaction: async fn => fn(tx) }), quiet);
  const input = { name: 'Lens', description: 'Details', active: false, price: 101, type: 'LENS', categoryId: id, tagIds: [], includesGuarantee: false, includesBag: false, includesSpray: false, includesCloth: false, lens };
  assert.equal((await action.ADMIN_CreateProductsAction(input)).success, true); assert.equal(data.active, false);
  for (const references of [0, 1]) {
    let archived = false;
    tx.product = { findUniqueOrThrow: async () => ({ lens: { id }, _count: { orderItem: references, cartItems: 0 } }), update: async () => { archived = true; }, delete: async () => {} };
    tx.lens = { delete: async args => { removed = args.where; } }; removed = undefined;
    assert.equal((await action.ADMIN_DeleteProduct(id, other)).success, true);
    assert.equal(archived, !!references); assert.deepEqual(removed, references ? undefined : { productId: id });
  }
});

test('F-09 invalidation uses real category routes after transaction commit', async () => {
  const events = [];
  const tx = { masterCategory: { create: async () => ({ id }) } };
  const action = load('lib/actions/admin.masterCategory.actions.ts', deps({ $transaction: async fn => { const result = await fn(tx); events.push('commit'); return result; } }, { 'next/cache': { revalidatePath: path => events.push(path) } }), quiet);
  await action.ADMIN_CreateMasterCategoryAction('Category', 'LENS');
  assert.equal(events[0], 'commit'); assert.ok(events.includes('/admin/master-category')); assert.ok(events.includes('/glasslens-order'));
});

test('F-11 expected errors survive JSON serialization and unexpected errors disclose no details', async () => {
  const { actionResult, ExpectedError, unwrapActionResult } = load('lib/action-result.ts', {}, quiet);
  const result = JSON.parse(JSON.stringify(await actionResult(async () => { throw new ExpectedError('Account must be verified.'); })));
  assert.equal(result.error, 'Account must be verified.'); assert.throws(() => unwrapActionResult(result), /verified/);
  assert.doesNotMatch((await actionResult(async () => { throw Error('secret-db-password'); })).error, /secret/);
});

test('F-12 Bale checks API/HTTP errors, bounds messages, uses settings and observes rejection', async () => {
  let sent;
  const transport = load('lib/bale.ts', { 'lib/db': { setting: { findUnique: async () => ({ baleGroupId: 'configured' }) } } }, { ...quiet, process: { env: { BALE_BOT_TOKEN: 'fake', BALE_CHAT_ID: 'fallback' } }, fetch: async (_, options) => { sent = JSON.parse(options.body); assert.ok(options.signal); return { ok: false, json: async () => ({ ok: false }) }; } });
  assert.equal((await transport.BALE_SendMessage('x'.repeat(5000))).success, false); assert.equal(sent.chat_id, 'configured'); assert.equal(sent.text.length, 4000);
});

test('F-13 count endpoint re-reads shared DB and rejects unauthorized access', async () => {
  let count = 2;
  const route = load('app/api/orders/order-stream/route.ts', deps({ orderBatch: { count: async () => count } }));
  assert.deepEqual(await (await route.GET()).json(), { count: 2 }); count = 0;
  assert.deepEqual(await (await route.GET()).json(), { count: 0 });
  const denied = load('app/api/orders/order-stream/route.ts', deps({}, { 'lib/access': { requireAdmin: async () => { throw Error('Denied'); } } }));
  assert.equal((await denied.GET()).status, 403);
});

test('F-16 refunded order cannot resume and snapshots retain original product facts', async () => {
  const { saveOrderUpdate } = load('lib/order-updates.ts', { 'lib/audit': { writeAudit: async () => {} } });
  await assert.rejects(saveOrderUpdate({ $queryRaw: async () => {}, orderBatch: { findUniqueOrThrow: async () => ({ status: 'ONHOLD', creditRefundedAt: new Date() }) } }, id, { id, newStatus: 'SENT' }), /cannot be reopened/);
  const { productSnapshot, restoreOrderSnapshots } = load('lib/order-snapshot.ts');
  const snap = productSnapshot(product);
  const saved = restoreOrderSnapshots({ orderItems: [{ productSnapshot: snap, product: { ...product, name: 'Edited', includesBag: false } }] });
  assert.equal(saved.orderItems[0].product.name, 'Lens name'); assert.equal(saved.orderItems[0].product.includesBag, true);
});

test('F-18 limiter shares atomic counters, hashes identities and enforces window maximum', async () => {
  let counter = 0, key;
  const limiter = load('lib/rate-limit.ts', { 'next/headers': { headers: async () => new Headers() }, 'lib/db': { rateLimit: { deleteMany: async () => {} }, $queryRaw: async (_strings, ...args) => { key = args[0]; return [{ count: ++counter }]; } } });
  assert.equal(await limiter.allowOperation('signup', 'private-ip', 2), true);
  assert.equal(await limiter.allowOperation('signup', 'private-ip', 2), true);
  assert.equal(await limiter.allowOperation('signup', 'private-ip', 2), false);
  assert.equal(key.length, 64); assert.doesNotMatch(key, /private-ip/);
});


test('F-14 daily pagination keeps every order in a selected user group and scopes receipts', async () => {
  const createdAt = new Date('2026-09-25T12:00:00Z');
  const orders = Array.from({ length: 55 }, (_, n) => ({ id: String(n), orederIdentification: n, status: 'PENDING', createdAt, deliveryPrice: 0, customerNote: '', user: { id, username: 'owner', storeName: '', credit: 10 }, orderItems: [{ purchasedPrice: 1, cutPrice: 0, odOnly: true }] }));
  const db = {
    user: { findMany: async ({ skip, take }) => { assert.equal(skip, 20); assert.equal(take, 20); return [{ id }]; }, count: async () => 21 },
    orderBatch: { findMany: async ({ where }) => { assert.deepEqual(where.userId.in, [id]); return orders; } },
    auditLog: { findMany: async ({ where }) => { assert.deepEqual(where.entityId.in, [id]); return []; } },
  };
  const action = load('lib/actions/admin.today-orders.action.ts', deps(db, { 'lib/settings': { getSettings: async () => ({ deliveryPrice: 0 }) } }), quiet);
  const result = await action.ADMIN_GetTodayOrdersAction('2026-09-25', '2');
  assert.equal(result.totalUsers, 21); assert.equal(result.orders.length, 55);
});

test('F-14 detail totals aggregate all rows independently of the displayed item page', async () => {
  const helper = load('lib/order-detail-totals.ts', { 'lib/db': { orderItem: { groupBy: async ({ where }) => { assert.equal(where.orderBatchId, id); return [{ odOnly: true, _count: 55, _sum: { purchasedPrice: 2805, cutPrice: 0 } }, { odOnly: false, _count: 2, _sum: { purchasedPrice: 202, cutPrice: 0 } }]; } } } });
  assert.deepEqual(await helper.orderDetailTotals(id, 10), { lensCount: 59, totalPrice: 3017 });
});
