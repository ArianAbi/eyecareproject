import Link from "next/link";
import { HardDrive, ImageIcon, Search, TextCursorInput } from "lucide-react";
import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import { MediaLibrary } from "./MediaLibrary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  const q = (params.q || "").trim().slice(0, 100);
  const where = q ? { OR: [
    { title: { contains: q, mode: "insensitive" as const } },
    { altText: { contains: q, mode: "insensitive" as const } },
    { description: { contains: q, mode: "insensitive" as const } },
    { filename: { contains: q, mode: "insensitive" as const } },
  ] } : {};
  const [assets, total, usage, incomplete] = await Promise.all([
    prisma.mediaAsset.findMany({ where, select: { filename: true, size: true, width: true, height: true, title: true, altText: true, description: true, keywords: true, createdAt: true, owner: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 24, skip: (page - 1) * 24 }),
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.aggregate({ _count: true, _sum: { size: true } }),
    prisma.mediaAsset.count({ where: { OR: [{ title: "" }, { altText: "" }] } }),
  ]);
  const href = (number: number) => `/admin/media?${new URLSearchParams({ ...(q ? { q } : {}), page: String(number) })}`;
  return <main className="mx-auto max-w-7xl space-y-6 pb-16">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2"><h1 className="flex items-center gap-2 text-2xl font-bold"><ImageIcon className="size-6 text-primary" />رسانه‌ها</h1><p className="text-sm text-muted-foreground">{total} تصویر عمومی؛ برای استفاده در مقاله، نشانی تصویر را کپی کنید.</p></div>
    </header>
    <nav role="tablist" aria-label="بخش‌های رسانه" className="flex gap-2 border-b pb-2 text-sm"><Link role="tab" aria-selected="true" href="/admin/media" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">رسانه‌های عمومی</Link><Link role="tab" aria-selected="false" href="/admin/media/users" className="rounded-md px-3 py-2 hover:bg-muted">فایل‌های کاربران</Link></nav>
    <div className="grid gap-4 sm:grid-cols-3">
      <Card size="sm"><CardHeader><CardTitle className="flex items-center justify-between text-sm text-muted-foreground">تصاویر عمومی<ImageIcon className="size-4" /></CardTitle></CardHeader><CardContent className="text-2xl font-bold">{usage._count}</CardContent></Card>
      <Card size="sm"><CardHeader><CardTitle className="flex items-center justify-between text-sm text-muted-foreground">فضای استفاده‌شده<HardDrive className="size-4" /></CardTitle></CardHeader><CardContent className="text-2xl font-bold">{((usage._sum.size ?? 0) / 1024 / 1024).toFixed(1)} MB</CardContent></Card>
      <Card size="sm"><CardHeader><CardTitle className="flex items-center justify-between text-sm text-muted-foreground">نیازمند تکمیل اطلاعات<TextCursorInput className="size-4" /></CardTitle></CardHeader><CardContent className="text-2xl font-bold">{incomplete}</CardContent></Card>
    </div>
    <form action="/admin/media" className="flex max-w-lg gap-2"><Input name="q" defaultValue={q} maxLength={100} aria-label="جستجوی رسانه" placeholder="جستجو در عنوان، متن جایگزین یا توضیح..." /><Button type="submit" variant="outline"><Search className="size-4" />جستجو</Button></form>
    <MediaLibrary assets={assets.map(asset => ({ ...asset, createdAt: asset.createdAt.toISOString() }))} />
    {total > 24 && <nav aria-label="صفحه‌بندی رسانه‌ها" className="flex justify-center gap-4 text-sm">{page > 1 && <Link href={href(page - 1)} className="text-primary">صفحه قبل</Link>}<span>{page} از {Math.ceil(total / 24)}</span>{page * 24 < total && <Link href={href(page + 1)} className="text-primary">صفحه بعد</Link>}</nav>}
  </main>;
}
