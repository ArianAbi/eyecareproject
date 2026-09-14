// contexts/OrderCountContext.tsx
"use client"

import { toast } from "@/components/ui/toast"
import { createContext, useContext, useEffect, useState } from "react"

const OrderCountContext = createContext<number | null>(null)

export function OrderCountProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const eventSource = new EventSource("/api/orders/order-stream")

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setCount(data.count)
      toast.add({
        type:"Info",
        title:"سفارش جدید ثبت شد",
        timeout:1500
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