// contexts/OrderCountContext.tsx
"use client"

import { toast } from "@/components/ui/toast"
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
    let skipToastFlag = false

    const eventSource = new EventSource("/api/orders/order-stream")

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setCount(data.count)

      if (!skipToastFlag) {
        skipToastFlag = true
        return
      }

      toast.add({
        type: "Info",
        title: "سفارش جدید ثبت شد",
        timeout: 1500
      })
    }

    return () => eventSource.close()
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
