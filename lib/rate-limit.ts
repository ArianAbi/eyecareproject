import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import prisma from "./db";

/** Configure only a header overwritten by a trusted reverse proxy. Never trust arbitrary X-Forwarded-For. */
export async function requestIdentity() {
  const header = process.env.RATE_LIMIT_IP_HEADER;
  return header ? (await headers()).get(header)?.slice(0, 200) || "unknown" : "shared";
}
export async function allowOperation(operation: string, identity: string, limit: number, windowMs = 60000) {
  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const key = createHash("sha256").update(`${operation}:${identity}:${window}`).digest("hex");
  const expiresAt = new Date((window + 1) * windowMs);
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt") VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET "count" = LEAST("RateLimit"."count" + 1, ${limit + 1}) RETURNING "count"`;
  return rows[0].count <= limit;
}
