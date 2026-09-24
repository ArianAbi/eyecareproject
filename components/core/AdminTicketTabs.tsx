"use client"

import type { ReactNode } from "react"
import { useSearchParamsUtil } from "@/hooks/useSearchParams"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

export function AdminTicketTabs({ status, children }: { status: 'OPEN' | 'CLOSED', children: ReactNode }) {
    const { setMany } = useSearchParamsUtil()

    return <Tabs value={status} onValueChange={value => setMany({ status: String(value), page: null })}>
        <TabsList aria-label="وضعیت تیکت‌ها" className="w-full" dir="rtl">
            <TabsTrigger value="OPEN">تیکت های باز</TabsTrigger>
            <TabsTrigger value="CLOSED">سایر تیکت ها</TabsTrigger>
        </TabsList>
        <TabsContent value={status} className="space-y-5">{children}</TabsContent>
    </Tabs>
}
