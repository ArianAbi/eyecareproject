// app/api/orders/count-stream/route.ts
import prisma from "@/lib/db"
import { orderEvents } from "@/lib/order-event"
import { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/access"

export async function GET(req: NextRequest) {
  try { await requireAdmin() } catch { return new Response('Forbidden', { status: 403 }) }
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const initialCount = await prisma.orderBatch.count({ where: { status: 'PENDING' } })
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count: initialCount })}\n\n`))

      const listener = (count: number) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`))
      }

      orderEvents.on("newOrder", listener)

      req.signal.addEventListener("abort", () => {
        orderEvents.off("newOrder", listener)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  })
}
