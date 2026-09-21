const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

const userId = '00000000-0000-4000-8000-000000000001'
const productId = '00000000-0000-4000-8000-000000000002'
const itemId = '00000000-0000-4000-8000-000000000003'
const input = { id: productId, od: { sph: '1.00', cyl: '-1.00', aux: '90' }, os: { sph: '0', cyl: '0', aux: '0' }, odOnly: true, rawOrCut: false, price: 1 }
const submit = { customerNote: 'یادداشت', deliveryPrice: 0 }

function setup({ admin = true, credit = 1000, status = 'VERIFIED', active = true, empty = false, auditFails = false } = {}) {
    const state = { orders: [], logs: [], items: empty ? [] : [{ id: itemId, productId, odSph: '1.00', odCyl: '-1.00', odAux: '90', osSph: '0', osCyl: '0', osAux: '0', odOnly: true, rawOrCut: 'RAW', product: { price: 501, active, type: 'LENS' } }], invalidated: [] }
    const owns = where => { assert.equal(where.cart.userId, userId); if (where.id !== itemId) throw Error('Not found') }
    const db = {
        user: { findUnique: async ({ where }) => { assert.equal(where.id, userId); return { id: userId } } },
        orderBatch: { count: async () => state.orders.length },
        $transaction: async (callback, options) => {
            const snapshot = structuredClone(state)
            try { return await callback({
                user: { findUniqueOrThrow: async ({ where }) => { assert.equal(where.id, userId); return { credit, userStatus: status } } },
                product: { findUnique: async () => ({ active, type: 'LENS' }) },
                cart: {
                    upsert: async ({ where, create }) => { assert.equal(where.userId, userId); assert.equal(create.userId, userId); return { id: 'selected-cart' } },
                    findUnique: async ({ where }) => { assert.equal(where.userId, userId); return { id: 'selected-cart', cartItems: state.items } },
                },
                cartItem: {
                    create: async ({ data }) => { assert.equal(data.cartId, 'selected-cart'); state.items.push(data); return { id: itemId, ...data } },
                    update: async ({ where }) => owns(where), delete: async ({ where }) => owns(where),
                    deleteMany: async ({ where }) => { assert.equal(where.cartId, 'selected-cart'); assert.deepEqual(where.id.in, [itemId]); state.items = [] },
                },
                orderBatch: { create: async ({ data }) => { assert.equal(options.isolationLevel, 'Serializable'); state.orders.push(data); return { id: 'saved-order', ...data } } },
            }) } catch (error) { Object.assign(state, snapshot); throw error }
        },
    }
    const dependencies = {
        zod: require('zod'), '../db': { default: db },
        '../access': { requireAdmin: async () => { if (!admin) throw Error('Forbidden'); return { id: 'acting-admin' } } },
        '../audit': { writeAudit: async (_tx, ...args) => { if (auditFails) throw Error('Audit failed'); state.logs.push(args) } },
        '../order-event': { orderEvents: { emit() {} } }, 'next/cache': { revalidatePath: path => state.invalidated.push(path) },
    }
    const exports = {}
    const compiled = ts.transpileModule(readFileSync(join(__dirname, 'admin.cart.actions.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
    new Function('require', 'exports', compiled)(name => { assert.ok(name in dependencies, name); return dependencies[name] }, exports)
    return { actions: exports, state }
}

test('every delegated cart action rejects non-admin callers', async () => {
    const { actions } = setup({ admin: false })
    for (const request of [() => actions.ADMIN_GetOrderUserAction(userId), () => actions.ADMIN_AddItemToCartAction(userId, input), () => actions.ADMIN_UpdateCartItemRawOrCutAction(userId, itemId, true), () => actions.ADMIN_DeleteItemFromCartAction(userId, itemId), () => actions.ADMIN_SubmitCartOrderAction(userId, submit)]) await assert.rejects(request, /Forbidden/)
})

test('adds to the selected cart and attributes the action to the admin', async () => {
    const { actions, state } = setup({ empty: true })
    const result = await actions.ADMIN_AddItemToCartAction(userId, input)
    assert.equal(result.success, true)
    assert.equal(result.cartItem.productId, productId)
    assert.equal(result.cartItem.price, undefined)
    assert.deepEqual(state.logs[0].slice(0, 4), ['acting-admin', 'ADMIN_CART_ITEM_ADDED', 'User', userId])
})

test('updates and deletes enforce selected-user ownership in the query', async () => {
    const { actions } = setup()
    await actions.ADMIN_UpdateCartItemRawOrCutAction(userId, itemId, true)
    await actions.ADMIN_DeleteItemFromCartAction(userId, itemId)
    await assert.rejects(actions.ADMIN_DeleteItemFromCartAction(userId, productId), /Not found/)
})

test('submission uses selected user, stored prices, and admin audit identity', async () => {
    const { actions, state } = setup()
    await actions.ADMIN_SubmitCartOrderAction(userId, submit)
    assert.equal(state.orders[0].userId, userId)
    assert.equal(state.orders[0].orderItems.create[0].purchasedPrice, 251)
    assert.equal(state.orders[0].status, 'PENDING')
    assert.equal(state.logs[0][0], 'acting-admin')
    assert.equal(state.items.length, 0)
    await assert.rejects(actions.ADMIN_SubmitCartOrderAction(userId, submit))
    assert.equal(state.orders.length, 1)
})

test('empty carts, unverified users, inactive products and insufficient credit cannot submit', async () => {
    for (const options of [{ empty: true }, { status: 'REJECTED' }, { active: false }, { credit: 250 }]) {
        const { actions, state } = setup(options)
        await assert.rejects(actions.ADMIN_SubmitCartOrderAction(userId, submit))
        assert.equal(state.orders.length, 0)
        assert.equal(state.logs.length, 0)
    }
})

test('audit failures roll back order creation and cart clearing', async () => {
    const { actions, state } = setup({ auditFails: true })
    await assert.rejects(actions.ADMIN_SubmitCartOrderAction(userId, submit), /Audit failed/)
    assert.equal(state.orders.length, 0)
    assert.equal(state.items.length, 1)
    assert.equal(state.invalidated.length, 0)
})
