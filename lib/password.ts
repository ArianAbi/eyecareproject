import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

// OWASP scrypt baseline; keep parameters versioned with the stored hash.
const prefix = "scrypt$131072$8$1"
const hashPattern = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 }, (error, key) => {
            if (error) reject(error)
            else resolve(key)
        })
    })
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16)
    const key = await deriveKey(password, salt)
    return `${prefix}$${salt.toString("hex")}$${key.toString("hex")}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const match = hashPattern.exec(storedHash)
    if (!match) return false
    const key = await deriveKey(password, Buffer.from(match[1], "hex"))
    return timingSafeEqual(key, Buffer.from(match[2], "hex"))
}
