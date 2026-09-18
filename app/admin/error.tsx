"use client"

import { Button } from "@/components/ui/button"

export default function AdminError({ reset }: { reset: () => void }) {
    return <div role="alert" className="space-y-4 p-8"><h2 className="text-lg font-semibold">بارگذاری اطلاعات انجام نشد</h2><p>اتصال پایگاه داده و اجرای مهاجرت‌ها را بررسی کنید.</p><Button onClick={reset}>تلاش دوباره</Button></div>
}
