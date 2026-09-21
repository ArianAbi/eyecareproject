import GlasslensOrderPage from "@/app/(main)/glasslens-order/GlasslensOrderPage"
import { AdminUserSearchFilter } from "@/components/core/AdminUserSearchFilter"
import { Badge } from "@/components/ui/badge"
import { ADMIN_GetOrderUserAction } from "@/lib/actions/admin.cart.actions"
import { GetProductsAction } from "@/lib/actions/products.action"
import { GetProductCategorys } from "@/lib/actions/productCategory.action"
import { GetTags } from "@/lib/actions/tags.action"
import { requireAdmin } from "@/lib/access"
import { selectedUser } from "@/lib/order-filters"
import { userStatusLabels } from "@/lib/user-status"
import type { Metadata } from "next"
import { z } from "zod"

export const metadata: Metadata = { title: 'ثبت سفارش برای کاربر' }

export default async function AdminGlasslensOrderPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
    await requireAdmin()
    const params = await searchParams
    const parsedId = z.string().uuid().safeParse(selectedUser(params.userId))
    const userId = parsedId.success ? parsedId.data : undefined
    const user = userId ? await ADMIN_GetOrderUserAction(userId) : null
    const catalog = user ? await Promise.all([GetProductsAction(), GetProductCategorys(true), GetTags()]) : null
    return <div className="space-y-4">
        <h1 className="text-xl font-semibold">ثبت سفارش برای کاربر</h1>
        <section className="space-y-3 rounded-lg border border-dashed p-3">
            <div className="max-w-sm"><AdminUserSearchFilter key={params.userId ?? 'empty'} initialValue={user ? JSON.stringify({ value: user.id, label: user.username }) : undefined} paramKey="userId" /></div>
            {user && <>
                <div className="flex flex-wrap items-center gap-3 text-sm"><span>{user.username}</span><span>{user.number}</span><span>{user.storeName}</span><Badge variant="outline">{userStatusLabels[user.userStatus]}</Badge><span>اعتبار: {user.credit.toLocaleString('fa-IR')} تومان</span></div>
                <p className="text-sm text-muted-foreground">سبد خرید فعلی این کاربر نمایش داده می‌شود. تغییرات و ثبت نهایی سفارش برای همین کاربر اعمال می‌شوند.</p>
            </>}
        </section>
        {user && catalog ? <GlasslensOrderPage key={user.id} adminUserId={user.id} accountStatus={user.userStatus} userCredit={user.credit}
            products={catalog[0].data} categorys={catalog[1].data} tags={catalog[2].data} cartItems={user.cart?.cartItems ?? []} />
            : <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{userId ? 'کاربر یافت نشد؛ کاربر دیگری انتخاب کنید.' : 'برای ثبت سفارش، ابتدا یک کاربر انتخاب کنید.'}</div>}
    </div>
}
