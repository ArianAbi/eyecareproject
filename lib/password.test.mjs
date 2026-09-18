import assert from "node:assert/strict"
import { test } from "node:test"
import { hashPassword, verifyPassword } from "./password.ts"

test("password hashes use unique salts and verify only the correct password", async () => {
    const password = "Test-password-123!"
    const first = await hashPassword(password)
    const second = await hashPassword(password)
    assert.notEqual(first, second)
    assert.ok(!first.includes(password))
    assert.equal(await verifyPassword(password, first), true)
    assert.equal(await verifyPassword("wrong-password", first), false)
    assert.equal(await verifyPassword(password, second), true)
})

test("plaintext and malformed or unsupported hashes are rejected", async () => {
    for (const value of ["", "Test-password-123!", "scrypt$invalid", "scrypt$999999999$8$1$00$00"]) {
        assert.equal(await verifyPassword("Test-password-123!", value), false)
    }
})

test("Unicode passwords round trip without normalization", async () => {
    const password = "رمزعبور-é-123"
    const hash = await hashPassword(password)
    assert.equal(await verifyPassword(password, hash), true)
    assert.equal(await verifyPassword(password.normalize("NFD"), hash), false)
})
