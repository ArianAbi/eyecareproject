const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load-ts.cjs');

const userId = '20000000-0000-4000-8000-000000000001';
const productId = '20000000-0000-4000-8000-000000000002';
const { calculateDiscount } = load('lib/discount.ts');
const items = [{ productId, odOnly: false, product: { price: 1000 } }, { productId: 'other', odOnly: false, product: { price: 500 } }];

function tx(overrides = {}) {
  return { discount: { findFirst: async () => ({
    id: 'discount', code: 'SAVE', title: 'Saving', active: true, expiresAt: null,
    maxUses: null, usedCount: 0, amountType: 'PERCENT', value: 1000,
    usersRestricted: false, productsRestricted: false, users: [], products: [],
    ...overrides,
  }) } };
}

test('percentage uses basis points and flat discounts cannot exceed eligible product subtotal', async () => {
  assert.equal((await calculateDiscount(tx(), ' save ', userId, items)).amount, 150);
  assert.equal((await calculateDiscount(tx({ amountType: 'FLAT', value: 4000, productsRestricted: true, products: [{ id: productId }] }), 'SAVE', userId, items)).amount, 1000);
});

test('discount restrictions remain closed if selected users or products disappear', async () => {
  await assert.rejects(calculateDiscount(tx({ usersRestricted: true }), 'SAVE', userId, items));
  await assert.rejects(calculateDiscount(tx({ productsRestricted: true }), 'SAVE', userId, items));
  assert.equal((await calculateDiscount(tx({ usersRestricted: true, users: [{ id: userId }] }), 'SAVE', userId, items)).amount, 150);
});

test('expired, exhausted and inactive codes cannot be applied', async () => {
  for (const overrides of [{ expiresAt: new Date(0) }, { maxUses: 1, usedCount: 1 }, { active: false }]) {
    await assert.rejects(calculateDiscount(tx(overrides), 'SAVE', userId, items));
  }
});

test('discount preview identifies an ineligible saved prescription before checkout', async () => {
  const product = {
    name: 'See Max 1.60', active: true, type: 'LENS', price: 1000,
    lens: { positiveFromSph: '0.00', positivToSph: '4.00', negativeFromSph: '0.00', negativeToSph: '-4.00', fromCyl: '0.00', toCyl: '-2.00' },
  };
  const cart = { cartItems: [{ productId, product, odSph: '-8.75', odCyl: '0.00', odAux: '0', osSph: '0.00', osCyl: '0.00', osAux: '0', odOnly: false }] };
  const action = load('lib/actions/discount.actions.ts', {
    'lib/db': { cart: { findUnique: async () => cart }, user: { findUniqueOrThrow: async () => ({ userStatus: 'VERIFIED' }) } },
    'lib/access': { requireUser: async () => ({ id: userId }) },
    'lib/audit': { writeAudit: async () => {} },
    'next/cache': { revalidatePath() {} },
  });
  const result = await action.PreviewDiscount('AUT-32');
  assert.equal(result.success, false);
  assert.match(result.error, /See Max 1\.60/);
  assert.match(result.error, /نسخه/);
});

test('customer and admin checkout both charge the reduced total and record one redemption', async () => {
  const lens = { positiveFromSph: '0.00', positivToSph: '4.00', negativeFromSph: '0.00', negativeToSph: '-4.00', fromCyl: '0.00', toCyl: '-2.00' };
  const product = { id: productId, price: 1000, name: 'Lens', active: true, type: 'LENS', lens, includesGuarantee: false, includesBag: false, includesCleaningCloth: false, includesCleaningSpray: false, categoryRel: { name: 'Category', color: 'blue' } };
  const row = { id: 'cart-item', productId, product, odSph: '1.00', odCyl: '-1.00', odAux: '90', osSph: '1.00', osCyl: '-1.00', osAux: '90', odOnly: false, rawOrCut: 'RAW', guaranteeClientName: '' };
  for (const admin of [false, true]) {
    let charged, created, ledger, reserved = 0;
    const tx = {
      user: { findUniqueOrThrow: async () => ({ userStatus: 'VERIFIED', credit: 2000 }), updateMany: async ({ data }) => { charged = data.credit.decrement; return { count: 1 }; } },
      creditTransaction: { create: async ({ data }) => { ledger = data; } },
      cart: { findUnique: async () => ({ id: 'cart', cartItems: [row] }) },
      cartItem: { deleteMany: async () => ({ count: 1 }) },
      discount: { findFirst: async () => ({ id: 'discount', code: 'SAVE', title: 'Saving', active: true, expiresAt: null, maxUses: 1, usedCount: 0, amountType: 'PERCENT', value: 1000, usersRestricted: false, productsRestricted: false, users: [], products: [] }) },
      $executeRaw: async () => { reserved++; return 1; },
      orderBatch: { create: async ({ data }) => { created = data; return { ...data, id: 'batch', orderItems: [row], orederIdentification: 1 }; } },
    };
    const db = { $transaction: async callback => callback(tx) };
    const deps = {
      'lib/db': db,
      'lib/Auth': { auth: async () => ({ user: { id: userId, username: 'owner' } }) },
      'lib/access': { requireAdmin: async () => ({ id: userId }) },
      'lib/audit': { writeAudit: async () => {} },
      'lib/bale': { BALE_SendMessage: async () => ({ success: true }) },
      'next/cache': { revalidatePath() {} },
    };
    const action = load(admin ? 'lib/actions/admin.cart.actions.ts' : 'lib/actions/cart.actions.ts', deps, { console: { error() {} } });
    const input = { customerNote: '', deliveryPrice: 0, discountCode: 'SAVE' };
    const result = await (admin ? action.ADMIN_SubmitCartOrderAction(userId, input) : action.SubmitCartOrderAction(input));
    assert.equal(result.success, true, JSON.stringify({ admin, result }));
    assert.equal(charged, 900);
    assert.equal(ledger.amount, -900);
    assert.equal(created.creditCharged, 900);
    assert.equal(created.discountRedemption.create.amountApplied, 100);
    assert.equal(created.discountRedemption.create.code, 'SAVE');
    assert.equal(reserved, 1);
  }
});
