import Link from "next/link";
import { FileText, ImageIcon, Search } from "lucide-react";
import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import { FileUploadForm } from "@/components/media/FileUploadForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function UserMediaPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  const q = (params.q || "").trim().slice(0, 100);
  const owners = q ? await prisma.user.findMany({ where: { username: { contains: q, mode: "insensitive" } }, select: { id: true }, take: 100 }) : [];
  const where = q ? { OR: [{ originalName: { contains: q, mode: "insensitive" as const } }, { ownerId: { in: owners.map(owner => owner.id) } }] } : {};
  const [assets, total] = await Promise.all([
    prisma.imageAsset.findMany({ where, orderBy: { createdAt: "desc" }, take: 24, skip: (page - 1) * 24 }),
    prisma.imageAsset.count({ where }),
  ]);
  const users = await prisma.user.findMany({ where: { id: { in: [...new Set(assets.map(asset => asset.ownerId))] } }, select: { id: true, username: true } });
  const names = new Map(users.map(user => [user.id, user.username]));
  const href = (number: number) => `/admin/media/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(number) })}`;
  return <main className="mx-auto max-w-7xl space-y-6 pb-16">
    <header><h1 className="text-2xl font-bold">رسانه‌ها</h1><p className="text-sm text-muted-foreground">فایل‌های بارگذاری‌شده توسط کاربران و مدیران</p></header>
    <nav role="tablist" aria-label="بخش‌های رسانه" className="flex gap-2 border-b pb-2 text-sm"><Link role="tab" aria-selected="false" href="/admin/media" className="rounded-md px-3 py-2 hover:bg-muted">رسانه‌های عمومی</Link><Link role="tab" aria-selected="true" href="/admin/media/users" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">فایل‌های کاربران</Link></nav>
    <FileUploadForm allowPublic />
    <form action="/admin/media/users" className="flex max-w-lg gap-2"><Input name="q" defaultValue={q} maxLength={100} aria-label="جستجوی فایل یا کاربر" placeholder="جستجوی نام فایل یا نام کاربری..." /><Button type="submit" variant="outline"><Search className="size-4" />جستجو</Button></form>
    {assets.length === 0 ? <p className="rounded-xl border p-8 text-center text-muted-foreground">فایلی پیدا نشد.</p> : <ul className="divide-y rounded-xl border">{assets.map(asset => <li key={asset.filename} className="flex flex-wrap items-center gap-3 p-4 text-sm">
      {asset.mimeType === "application/pdf" ? <FileText className="size-5 shrink-0" /> : <ImageIcon className="size-5 shrink-0" />}
      <div className="min-w-0 flex-1"><a href={`/api/files/${asset.filename}`} target="_blank" rel="noreferrer" className="block truncate font-medium text-primary hover:underline">{asset.originalName || asset.filename}</a><span className="text-xs text-muted-foreground">{names.get(asset.ownerId) || asset.ownerId} · {asset.createdAt.toLocaleDateString("fa-IR")} · {Math.ceil(asset.size / 1024)} KB</span></div>
      <span className="rounded-full bg-muted px-2 py-1 text-xs">{asset.visibility === "PUBLIC" ? "عمومی" : "خصوصی"}</span>
    </li>)}</ul>}
    {total > 24 && <nav aria-label="صفحه‌بندی فایل‌ها" className="flex justify-center gap-4 text-sm">{page > 1 && <Link href={href(page - 1)} className="text-primary">صفحه قبل</Link>}<span>{page} از {Math.ceil(total / 24)}</span>{page * 24 < total && <Link href={href(page + 1)} className="text-primary">صفحه بعد</Link>}</nav>}
  </main>;
}
