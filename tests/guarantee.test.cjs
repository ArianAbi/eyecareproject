const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');

const userId = '20000000-0000-4000-8000-000000000001';
const itemId = '20000000-0000-4000-8000-000000000002';
const otherUserId = '20000000-0000-4000-8000-000000000003';

function setup({ signedIn = true, admin = false, owner = userId, guarantee = true } = {}) {
  let saved;
  let audits = 0;
  const mocks = {
    zod: require('zod'),
    '../Auth': { auth: async () => signedIn ? { user: { id: userId } } : null },
    '../access': { requireAdmin: async () => { if (!admin) throw Error('Forbidden'); } },
    '../audit': { writeAudit: async () => { audits++; } },
    '../db': { $transaction: async callback => callback({ cartItem: {
      update: async ({ where, data }) => {
        if (where.id !== itemId || where.cart.userId !== owner || where.product.includesGuarantee !== guarantee) throw Error('Not found');
        saved = data.guaranteeClientName;
      },
    } }) },
  };
  const output = ts.transpileModule(fs.readFileSync('lib/actions/guarantee.actions.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(name => {
    if (!(name in mocks)) throw Error(`Unexpected dependency: ${name}`);
    return mocks[name];
  }, module, module.exports);
  return { save: module.exports.UpdateCartItemGuaranteeAction, saved: () => saved, audits: () => audits };
}

test('guarantee name is trimmed, saved and can be cleared', async () => {
  const action = setup();
  assert.equal((await action.save(itemId, '  Client Name  ')).guaranteeClientName, 'Client Name');
  assert.equal(action.saved(), 'Client Name');
  await action.save(itemId, '   ');
  assert.equal(action.saved(), '');
  assert.equal(action.audits(), 2);
});

test('unauthenticated users, other carts and products without guarantees cannot be updated', async () => {
  for (const config of [{ signedIn: false }, { owner: otherUserId }, { guarantee: false }]) {
    const action = setup(config);
    await assert.rejects(action.save(itemId, 'Client'));
    assert.equal(action.saved(), undefined);
  }
});

test('acting for another user requires admin permission', async () => {
  await assert.rejects(setup({ owner: otherUserId }).save(itemId, 'Client', otherUserId));
  const action = setup({ admin: true, owner: otherUserId });
  await action.save(itemId, 'Client', otherUserId);
  assert.equal(action.saved(), 'Client');
});

test('invalid IDs, non-string names and names above 200 characters are rejected', async () => {
  const action = setup();
  for (const [id, name] of [['invalid', 'Client'], [itemId, null], [itemId, 'x'.repeat(201)]]) {
    await assert.rejects(action.save(id, name));
  }
  assert.equal(action.saved(), undefined);
});
