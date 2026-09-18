const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

function loadAction(session, prisma) {
    const source = readFileSync(join(__dirname, 'cart.actions.ts'), 'utf8')
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    const exports = {}
    const dependencies = {
        '@/generated/prisma/client': { Prisma: {} },
        '@/lib/db': { default: prisma },
        '../action-error': {},
        '../Auth': { auth: async () => session },
        'next/cache': {},
        '../audit': { writeAudit: async () => {} },
        '../order-event': { orderEvents: { emit() {} } },
    }
    new Function('require', 'exports', 'console', compiled)(name => {
        assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
        return dependencies[name]
    }, exports, { error() {} })
    return exports.AddItemToCartAction
}

const item = {
    id: 'product-1',
    od: { sph: '1.00', cyl: '-0.50', aux: '90' },
    os: { sph: '2.00', cyl: '-1.00', aux: '80' },
    odOnly: false,
    rawOrCut: false,
}

test('signed-out requests cannot write a cart', async () => {
    const add = loadAction(null, { $transaction() { assert.fail('Unexpected write') } })
    assert.equal((await add(item)).success, false)
})

test('saves to the server session user cart and returns the persisted item ID', async () => {
    let saved
    const add = loadAction({ user: { id: 'session-user' } }, {
        $transaction: async callback => callback({
            cart: { upsert: async args => {
                assert.equal(args.where.userId, 'session-user')
                assert.equal(args.create.userId, 'session-user')
                return { id: 'cart-1' }
            } },
            cartItem: { create: async ({ data }) => {
                saved = data
                return { id: 'saved-item-1', ...data }
            } },
        }),
    })
    const result = await add({ ...item, userId: 'forged-user' })
    assert.equal(result.success, true)
    assert.equal(result.cartItem.id, 'saved-item-1')
    assert.deepEqual(saved, {
        cartId: 'cart-1', productId: 'product-1',
        odSph: '1.00', odCyl: '-0.50', odAux: '90',
        osSph: '2.00', osCyl: '-1.00', osAux: '80',
        odOnly: false, rawOrCut: 'RAW',
    })
})

test('database failures return an explicit failure instead of a successful local item', async () => {
    const add = loadAction({ user: { id: 'session-user' } }, {
        $transaction: async () => { throw new Error('database unavailable') },
    })
    const result = await add(item)
    assert.equal(result.success, false)
    assert.ok(result.error)
    assert.equal(result.cartItem, undefined)
})
