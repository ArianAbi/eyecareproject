import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import DiscountManager from "./DiscountManager";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DiscountFilters = { page?: string; q?: string; status?: string; amountType?: string };

export default async function DiscountsPage({ searchParams }: { searchParams: Promise<DiscountFilters> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Math.min(100000, Number.isSafeInteger(Number(params.page)) ? Number(params.page) : 1));
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const status = params.status === "active" || params.status === "inactive" ? params.status : "all";
  const amountType = params.amountType === "PERCENT" || params.amountType === "FLAT" ? params.amountType : "all";
  const where: Prisma.DiscountWhereInput = {
    ...(q && { OR: [{ code: { contains: q, mode: "insensitive" } }, { title: { contains: q, mode: "insensitive" } }] }),
    ...(status !== "all" && { active: status === "active" }),
    ...(amountType !== "all" && { amountType }),
  };
  const [total, discounts] = await Promise.all([prisma.discount.count({ where }), prisma.discount.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { users: { select: { id: true, username: true } }, products: { select: { id: true, name: true } } },
    take: 20, skip: (page - 1) * 20,
  })]);
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (status !== "all") query.set("status", status);
    if (amountType !== "all") query.set("amountType", amountType);
    query.set("page", String(nextPage));
    return `/admin/discounts?${query}`;
  };
  return <div className="space-y-4">
    <h1 className="text-xl font-semibold">مدیریت کدهای تخفیف</h1>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
      <label className="min-w-48 flex-1 text-sm">کد یا عنوان<Input name="q" defaultValue={q} placeholder="جستجوی تخفیف" /></label>
      <label className="text-sm">وضعیت<select name="status" defaultValue={status} className="block h-9 rounded border bg-background px-2"><option value="all">همه</option><option value="active">فعال</option><option value="inactive">غیرفعال</option></select></label>
      <label className="text-sm">نوع<select name="amountType" defaultValue={amountType} className="block h-9 rounded border bg-background px-2"><option value="all">همه</option><option value="PERCENT">درصدی</option><option value="FLAT">مبلغ ثابت</option></select></label>
      <Button type="submit">اعمال فیلتر</Button>
      <Link href="/admin/discounts" className="text-sm underline">پاک کردن</Link>
    </form>
    <DiscountManager discounts={discounts} />
    <nav className="flex gap-3 text-sm">{page > 1 && <Link href={pageHref(page - 1)}>صفحه قبل</Link>}{page * 20 < total && <Link href={pageHref(page + 1)}>صفحه بعد</Link>}</nav>
  </div>;
}
