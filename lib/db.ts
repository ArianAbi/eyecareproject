import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prismaClientSingleton = () => {
    return new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
    })
}

declare const globalThis: {
    prismaGlobal?: ReturnType<typeof prismaClientSingleton>;
} & typeof global
// Hot reload can retain an instance created before the analytics model existed.
const cached = globalThis.prismaGlobal
const prisma = cached?.trafficVisit ? cached : prismaClientSingleton()

if (cached && cached !== prisma) {
    void cached.$disconnect().catch(() => {})
}

export default prisma
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
