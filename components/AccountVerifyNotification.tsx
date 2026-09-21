"use client"

import ProfileAccountStatus from "@/app/(main)/profile/ProfileAccountStatus"
import { UserVerifyType } from "@/generated/prisma/enums"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AccountVerifyNotification({ accountStatus }: { accountStatus: UserVerifyType }) {

    const pathname = usePathname()
    if (pathname.startsWith('/profile')) return <></>

    if (accountStatus === 'WAITING_FOR_APPROVAL' || accountStatus === 'REJECTED') {
        return <div className="mt-2 mb-2 mx-2">
            <ProfileAccountStatus accountStatus={accountStatus} />
        </div>
    }

    return <div className="flex gap-2 bg-amber-500/30 border border-amber-500/70
            max-w-5xl w-fit text-wrap mx-5 my-2 rounded-lg p-2">
        <div className="grid place-items-center h-full stroke-amber-300 ml-2">
            <AlertTriangle size={32} stroke="inherit" />
        </div>

        <div className="space-y-2">
            <div className="font-semibold">
                احراز هویت
            </div>

            <div className="text-sm">
                برای ثبت سفارش باید حساب خود را تایید کنید. این کار رو از صفحه پروفایل انجام دهید

            </div>
            <Link href="/profile"
                className="font-semibold mt-4 text-sm border mr-1 hover:bg-white/20 rounded-md px-2">
                صفحه پروفایل
            </Link>
        </div>
    </div>
}