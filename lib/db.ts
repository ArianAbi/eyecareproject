import { Prisma, PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createHash } from "node:crypto"

const prismaClientSingleton = () => {
    return new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
    })
}

declare const globalThis: {
    prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
    prismaSchemaFingerprint?: string;
} & typeof global
// Next.js hot reload preserves globals, including clients built from an older schema.
// Match generated model/field names, not just the presence of one model.
const schemaFingerprint = createHash('sha256')
    .update(Prisma.prismaVersion.client)
    .update(JSON.stringify(Object.entries(Prisma)
        .filter(([name]) => name.endsWith('ScalarFieldEnum'))
        .sort(([left], [right]) => left.localeCompare(right))))
    .digest('hex')
const cached = globalThis.prismaGlobal
const prisma = cached && globalThis.prismaSchemaFingerprint === schemaFingerprint
    ? cached
    : prismaClientSingleton()

if (cached && cached !== prisma) {
    void cached.$disconnect().catch(() => {})
}

export default prisma
if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = prisma
    globalThis.prismaSchemaFingerprint = schemaFingerprint
}
