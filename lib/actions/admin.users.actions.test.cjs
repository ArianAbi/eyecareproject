const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

const id = '00000000-0000-4000-8000-000000000001'
function setup({ admin = true, credit = 100, status = 'WAITING_FOR_APPROVAL', auditFails = false } = {}) {
    const state = { credit, status, logs: [], invalidated: [] }
    const dependencies = {
        '../access': { requireAdmin: async () => { if (!admin) throw Error('Forbidden'); return { id: 'admin' } } },
        '../audit': { writeAudit: async (_tx, ...args) => { if (auditFails) throw Error('Audit failed'); state.logs.push(args) } },
        '../action-error': {}, '../pagination-object': {}, zod: require('zod'),
        'next/cache': { revalidatePath: path => state.invalidated.push(path) },
        '../db': { default: { $transaction: async callback => {
            const before = { credit: state.credit, status: state.status, logs: [...state.logs] }
            try { return await callback({ user: { updateMany: async ({ where, data }) => {
                if (where.id !== id || (where.credit !== undefined && where.credit !== state.credit) || (where.userStatus !== undefined && where.userStatus !== state.status)) return { count: 0 }
                if (data.credit) state.credit += data.credit.increment
                if (data.userStatus) state.status = data.userStatus
                return { count: 1 }
            } } }) } catch (error) { Object.assign(state, before); throw error }
        } } },
    }
    const exports = {}
    const source = ts.transpileModule(readFileSync(join(__dirname, 'admin.users.actions.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText
    new Function('require', 'exports', source)(name => {
        assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
        return dependencies[name]
    }, exports)
    return { actions: exports, state }
}

const adjustment = { id, amount: 50, expectedCredit: 100, reason: 'اصلاح اعتبار' }

test('non-admins cannot change account status or credit', async () => {
    const { actions, state } = setup({ admin: false })
    await assert.rejects(actions.ADMIN_AdjustUserCreditAction(adjustment), /Forbidden/)
    await assert.rejects(actions.ADMIN_SetUserStatusAction({ id, status: 'VERIFIED', expectedStatus: 'WAITING_FOR_APPROVAL' }), /Forbidden/)
    assert.equal(state.credit, 100)
    assert.equal(state.logs.length, 0)
})

test('credit increase and decrease write the balance and audit together', async () => {
    const { actions, state } = setup()
    await actions.ADMIN_AdjustUserCreditAction(adjustment)
    assert.equal(state.credit, 150)
    assert.deepEqual(state.logs[0].slice(0, 4), ['admin', 'USER_CREDIT_ADJUSTED', 'User', id])
    await actions.ADMIN_AdjustUserCreditAction({ ...adjustment, amount: -150, expectedCredit: 150 })
    assert.equal(state.credit, 0)
    assert.equal(state.logs.length, 2)
})

test('stale or repeated credit submissions cannot overwrite a new balance', async () => {
    const { actions, state } = setup()
    await actions.ADMIN_AdjustUserCreditAction(adjustment)
    await assert.rejects(actions.ADMIN_AdjustUserCreditAction(adjustment))
    assert.equal(state.credit, 150)
    assert.equal(state.logs.length, 1)
})

test('invalid amounts, missing reasons, overdrafts and integer overflow are rejected', async () => {
    for (const input of [{ amount: 0 }, { amount: 1.5 }, { amount: -101 }, { amount: 2147483647 }, { reason: ' ' }]) {
        const { actions, state } = setup()
        await assert.rejects(actions.ADMIN_AdjustUserCreditAction({ ...adjustment, ...input }))
        assert.equal(state.credit, 100)
        assert.equal(state.logs.length, 0)
    }
})

test('audit failure rolls the balance back and does not invalidate pages', async () => {
    const { actions, state } = setup({ auditFails: true })
    await assert.rejects(actions.ADMIN_AdjustUserCreditAction(adjustment), /Audit failed/)
    assert.equal(state.credit, 100)
    assert.equal(state.invalidated.length, 0)
})

test('status changes validate the enum and reject stale approvals', async () => {
    const { actions, state } = setup()
    await actions.ADMIN_SetUserStatusAction({ id, status: 'VERIFIED', expectedStatus: 'WAITING_FOR_APPROVAL' })
    assert.equal(state.status, 'VERIFIED')
    await assert.rejects(actions.ADMIN_SetUserStatusAction({ id, status: 'REJECTED', expectedStatus: 'WAITING_FOR_APPROVAL' }))
    await assert.rejects(actions.ADMIN_SetUserStatusAction({ id, status: 'INVALID', expectedStatus: 'VERIFIED' }))
    assert.equal(state.status, 'VERIFIED')
    assert.equal(state.logs.length, 1)
    assert.ok(state.invalidated.includes('/admin'))
})
