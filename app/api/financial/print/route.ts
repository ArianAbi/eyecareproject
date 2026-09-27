import { auth } from "@/lib/Auth"
import { createCreditStatementResponse } from "@/lib/credit-statement"

export const runtime = "nodejs"
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })
  return createCreditStatementResponse(session.user.id)
}
