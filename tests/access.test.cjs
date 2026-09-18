const { test } = require('node:test')
const assert = require('node:assert/strict')
const { load } = require('./load.cjs')

test('admin authorization reads the current database role, not a session flag', async () => {
    const { requireAdmin } = load('lib/access.ts', {
        './Auth': { auth: async () => ({ user: { id: 'user', admin: true } }) },
        './db': { default: { user: { findUnique: async () => ({ admin: false }) } } },
    })
    await assert.rejects(requireAdmin())
})

test('standalone isAdmin returns false when signed out', async () => {
    const { isAdmin } = load('lib/actions/isAdmin.action.ts', {
        '../Auth': { auth: async () => null }, '../db': { default: {} },
    })
    assert.equal(await isAdmin(), false)
})

test('catalog administration rejects ordinary users before querying records', async () => {
    for (const [file, method] of [
        ['admin.productCategory.actions', 'ADMIN_GetProductCategorys'],
        ['admin.products.action', 'ADMIN_GetProducts'],
        ['admin.masterCategory.actions', 'ADMIN_GetMasterCategorys'],
        ['admin.tag.action', 'ADMIN_GetTags'],
        ['admin.users.actions', 'ADMIN_GetUsersActions'],
    ]) {
        const api = load(`lib/actions/${file}.ts`, {
            '../db': { default: {} }, '../access': { requireAdmin: async () => { throw Error('Forbidden') } },
            '../audit': { writeAudit: async () => {} }, 'next/cache': { revalidatePath() {} },
            '@/generated/prisma/client': { Prisma: {} },
        })
        await assert.rejects(api[method]())
    }
})
