import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/access";

/** Poll the shared database so counts recover across workers and reconnects. */
export async function GET() {
  try { await requireAdmin(); } catch { return new Response(null, { status: 403 }); }
  const count = await prisma.orderBatch.count({ where: { status: "PENDING" } });
  return Response.json({ count }, { headers: { "Cache-Control": "private, no-store" } });
}
