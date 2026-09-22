"use client"

import { useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ListFilter, X } from "lucide-react"
import { userStatusLabels } from "@/lib/user-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

const STATUS_ALL = "ALL"

export function UserFilters() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState(searchParams.get("status") ?? STATUS_ALL)

    const activeCount = ["username", "number", "status"]
        .filter(key => Boolean(searchParams.get(key))).length

    function apply(formData: FormData) {
        const params = new URLSearchParams(searchParams.toString())
        const username = String(formData.get("username") ?? "").trim()
        const number = String(formData.get("number") ?? "").trim()

        if (username) params.set("username", username)
        else params.delete("username")

        if (number) params.set("number", number)
        else params.delete("number")

        if (status !== STATUS_ALL) params.set("status", status)
        else params.delete("status")

        params.delete("page")
        router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`)
        setOpen(false)
    }

    function clear() {
        const params = new URLSearchParams(searchParams.toString())
        for (const key of ["username", "number", "status", "page"]) params.delete(key)
        setStatus(STATUS_ALL)
        router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`)
        setOpen(false)
    }

    return <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button size="sm" variant="outline" />}>
                <ListFilter />
                فیلترها
                {activeCount > 0 &&
                    <Badge className="ms-1 h-5 min-w-5 rounded-full px-1.5">
                        {activeCount.toLocaleString("fa-IR")}
                    </Badge>
                }
            </SheetTrigger>

            <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-sm">
                <SheetHeader>
                    <SheetTitle>فیلتر کاربران</SheetTitle>
                    <SheetDescription>
                        کاربران را براساس نام کاربری، شماره تلفن یا وضعیت حساب فیلتر کنید.
                    </SheetDescription>
                </SheetHeader>

                <Separator />

                <form action={apply} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 space-y-5 overflow-y-auto p-4">
                        <div className="space-y-2">
                            <Label htmlFor="user-filter-username">نام کاربری</Label>
                            <Input
                                id="user-filter-username"
                                name="username"
                                defaultValue={searchParams.get("username") ?? ""}
                                placeholder="نام کاربری را وارد کنید"
                                maxLength={100}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user-filter-number">شماره تلفن</Label>
                            <Input
                                id="user-filter-number"
                                name="number"
                                type="tel"
                                inputMode="numeric"
                                defaultValue={searchParams.get("number") ?? ""}
                                placeholder="مثلاً 0912"
                                maxLength={20}
                                dir="ltr"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>وضعیت حساب</Label>
                            <Select value={status} onValueChange={value => setStatus(value ?? STATUS_ALL)}>
                                <SelectTrigger className="w-full" aria-label="وضعیت حساب">
                                    <SelectValue>
                                        {status === STATUS_ALL
                                            ? "همه وضعیت‌ها"
                                            : userStatusLabels[status as keyof typeof userStatusLabels]}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={STATUS_ALL}>همه وضعیت‌ها</SelectItem>
                                    {Object.entries(userStatusLabels).map(([value, label]) =>
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    <SheetFooter>
                        <Button type="submit" className="w-full">نمایش نتایج</Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            disabled={activeCount === 0}
                            onClick={clear}>
                            <X />
                            پاک کردن فیلترها
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>

        {activeCount > 0 &&
            <Button variant="outline" size="icon-xs" aria-label="پاک کردن فیلترها" onClick={clear}>
                <X />
            </Button>
        }
    </div>
}
