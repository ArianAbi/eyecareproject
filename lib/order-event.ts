// lib/order-events.ts
import { EventEmitter } from "events"

declare global {
  var orderEventEmitter: EventEmitter | undefined
}

// survives Next.js dev hot-reload; in prod it's just module-scoped
export const orderEvents = globalThis.orderEventEmitter ?? new EventEmitter()

if (process.env.NODE_ENV !== "production") {
  globalThis.orderEventEmitter = orderEvents
}