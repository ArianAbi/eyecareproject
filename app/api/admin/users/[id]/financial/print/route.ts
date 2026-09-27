import { auth } from "@/lib/Auth"
import prisma from "@/lib/db"
import { createCreditStatementResponse } from "@/lib/credit-statement"

export const runtime = "nodejs"
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })
  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } })
  if (!admin?.admin) return new Response("Forbidden", { status: 403 })
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new Response("Not found", { status: 404 })
  return createCreditStatementResponse(id)
}
