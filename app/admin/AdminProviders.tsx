// contexts/OrderCountContext.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"

const OrderCountContext = createContext<number | null>(null)
const ApprovalCountContext = createContext(0)
const OpenTicketCountContext = createContext(0)
const CreditInvoiceCountContext = createContext(0)

export function ApprovalCountProvider({ count, children }: { count: number, children: React.ReactNode }) {
  return <ApprovalCountContext.Provider value={count}>{children}</ApprovalCountContext.Provider>
}

export function useApprovalCount() {
  return useContext(ApprovalCountContext)
}

export function OpenTicketCountProvider({ count, children }: { count: number, children: React.ReactNode }) {
  return <OpenTicketCountContext.Provider value={count}>{children}</OpenTicketCountContext.Provider>
}

export function useOpenTicketCount() {
  return useContext(OpenTicketCountContext)
}

export function CreditInvoiceCountProvider({ count, children }: { count: number, children: React.ReactNode }) {
  return <CreditInvoiceCountContext.Provider value={count}>{children}</CreditInvoiceCountContext.Provider>
}

export function useCreditInvoiceCount() {
  return useContext(CreditInvoiceCountContext)
}

export function OrderCountProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      try {
        const response = await fetch("/api/orders/order-stream", { cache: "no-store", signal: controller.signal })
        if (response.ok) { const data = await response.json(); if (!controller.signal.aborted) setCount(data.count) }
      } catch { /* Retry transient connection failures without announcing false new orders. */ }
      finally { if (!controller.signal.aborted) timer = setTimeout(poll, 15000) }
    }
    void poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])

  return (
    <OrderCountContext.Provider value={count}>
      {children}
    </OrderCountContext.Provider>
  )
}

export function useOrderCount() {
  return useContext(OrderCountContext)
}
