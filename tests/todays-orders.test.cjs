const assert = require("node:assert/strict")
const test = require("node:test")
const fs = require("node:fs")
const ts = require("typescript")
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename)
const { groupTodayOrders, todayOrderUsers } = require("../lib/todays-orders.ts")
const { tehranDay, parseDateFilterParam } = require("../lib/prisma-date-filter.ts")
const { dailyChargeInput, deductDailyOrderCharge } = require("../lib/daily-order-charge.ts")

test("all statuses remain visible; filtering keeps whole user groups and today's dropdown users", () => {
    const orders = ["PENDING", "APPROVED", "INPROCESS", "FINISHED", "SENT", "ONHOLD"].map((status, i) => ({
        id: String(i), status, total: 100, user: { id: i < 5 ? "a" : "b", username: i < 5 ? "A" : "B" },
    }))
    assert.deepEqual(groupTodayOrders(orders).map(g => [g.orders.length, g.total]), [[5, 500], [1, 100]])
    assert.equal(groupTodayOrders(orders, "all", "ONHOLD")[0].user.id, "b")
    assert.equal(groupTodayOrders(orders, "a", "ONHOLD").length, 0)
    assert.deepEqual(todayOrderUsers(orders).map(user => user.id), ["a", "b"])
    assert.deepEqual(groupTodayOrders([]), [])
})

test("today uses Tehran midnight and an exclusive next-day boundary", () => {
    assert.equal(tehranDay(new Date("2026-09-23T20:29:59Z")), "2026-09-23")
    assert.equal(tehranDay(new Date("2026-09-23T20:30:00Z")), "2026-09-24")
    const range = parseDateFilterParam('{"from":"2026-09-23"}')
    assert.equal(range.gte.toISOString(), "2026-09-22T20:30:00.000Z")
    assert.equal(range.lt.toISOString(), "2026-09-23T20:30:00.000Z")
})

const input = () => ({ userId: "20000000-0000-4000-8000-000000000001", requestId: "20000000-0000-4000-8000-000000000002",
    day: tehranDay(), kind: "delivery", amount: 50, expectedCredit: 100, reason: "delivery fee" })
function mockTx() {
    const receipts = new Map(), events = []
    let credit = 100
    return {
        receipts, events, balance: () => credit,
        $queryRaw: async () => [],
        auditLog: { findUnique: async ({ where }) => receipts.get(where.id), create: async ({ data }) => { receipts.set(data.id, data); return data } },
        orderBatch: { findFirst: async () => ({ id: "order", status: "PENDING" }) },
        setting: { findUnique: async () => ({ deliveryPrice: 50 }) },
        user: { updateMany: async ({ where, data }) => {
            if (where.credit !== credit) return { count: 0 }
            credit -= data.credit.decrement
            return { count: 1 }
        } },
        orderUpdate: { create: async ({ data }) => { events.push(data); return data } },
    }
}

test("daily delivery deducts once across different requests and creates a customer-visible event", async () => {
    const tx = mockTx(), first = input()
    assert.equal((await deductDailyOrderCharge(tx, "admin", first)).alreadyApplied, false)
    assert.equal((await deductDailyOrderCharge(tx, "admin2", { ...first, requestId: "different" })).alreadyApplied, true)
    assert.equal(tx.balance(), 50)
    assert.equal(tx.receipts.size, 1)
    assert.equal(tx.events.length, 1)
    assert.equal(tx.events[0].adminOnly, false)
    assert.equal(tx.events[0].orderBatchId, "order")
})

test("custom fee retries are idempotent and changed replay payloads fail", async () => {
    const tx = mockTx(), custom = { ...input(), kind: "custom", amount: 10, reason: "custom fee" }
    await deductDailyOrderCharge(tx, "admin", custom)
    await deductDailyOrderCharge(tx, "admin", custom)
    assert.equal(tx.balance(), 90)
    await assert.rejects(deductDailyOrderCharge(tx, "admin", { ...custom, amount: 20 }))
})

test("invalid amount, insufficient or stale balances, old days, absent orders and changed delivery price are rejected", async () => {
    for (const amount of [0, -1, 1.5, 2147483648]) assert.equal(dailyChargeInput.safeParse({ ...input(), amount }).success, false)
    for (const patch of [{ expectedCredit: 40 }, { expectedCredit: 99 }, { day: "2000-01-01" }, { amount: 60 }]) {
        const tx = mockTx()
        await assert.rejects(deductDailyOrderCharge(tx, "admin", { ...input(), ...patch }))
        assert.equal(tx.balance(), 100)
        assert.equal(tx.receipts.size, 0)
    }
    const tx = mockTx()
    tx.orderBatch.findFirst = async () => null
    await assert.rejects(deductDailyOrderCharge(tx, "admin", input()))
    assert.equal(tx.balance(), 100)
})
