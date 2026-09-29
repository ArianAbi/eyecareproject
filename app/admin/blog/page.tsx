import Link from "next/link";
import prisma from "@/lib/db";
import { requireAdmin } from "@/lib/access";
import { blogDate } from "@/lib/blog";
import { ArchiveButton } from "./ArchiveButton";
import { DuplicateButton } from "./DuplicateButton";

type Filters = { page?: string; q?: string; status?: string; category?: string; from?: string; to?: string };
const labels = { DRAFT: "پیش‌نویس", SCHEDULED: "زمان‌بندی شده", PUBLISHED: "منتشر شده", ARCHIVED: "بایگانی" };

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<Filters> }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  const q = (params.q || "").trim().slice(0, 100);
  const status = params.status && params.status in labels ? params.status as keyof typeof labels : undefined;
  const category = /^[0-9a-f-]{36}$/.test(params.category || "") ? params.category : undefined;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(params.from || "") ? params.from : undefined;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(params.to || "") ? params.to : undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    ...(from || to ? { publishedAt: { ...(from ? { gte: new Date(`${from}T00:00:00+03:30`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59+03:30`) } : {}) } } : {}),
  };
  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({ where, include: { category: true, author: { select: { username: true } } }, orderBy: { updatedAt: "desc" }, take: 20, skip: (page - 1) * 20 }),
    prisma.blogPost.count({ where }),
    prisma.blogCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const pageHref = (number: number) => `/admin/blog?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), ...(category ? { category } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}), page: String(number) })}`;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">مقاله‌های وبلاگ</h1><p className="mt-1 text-sm text-muted-foreground">{total} مقاله</p></div><div className="flex gap-2"><Link href="/admin/blog/terms" className="rounded-lg border px-4 py-2">دسته‌ها و برچسب‌ها</Link><Link href="/admin/blog/create" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">مقاله جدید</Link></div></div>
    <form className="flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="جستجوی عنوان" aria-label="جستجوی عنوان" className="rounded-lg border bg-background px-3 py-2" /><select name="status" defaultValue={status || ""} aria-label="وضعیت" className="rounded-lg border bg-background px-3 py-2"><option value="">همه وضعیت‌ها</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="category" defaultValue={category || ""} aria-label="دسته‌بندی" className="rounded-lg border bg-background px-3 py-2"><option value="">همه دسته‌ها</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><label className="flex items-center gap-1 text-sm">از <input name="from" type="date" defaultValue={from} className="rounded-lg border bg-background px-2 py-2" /></label><label className="flex items-center gap-1 text-sm">تا <input name="to" type="date" defaultValue={to} className="rounded-lg border bg-background px-2 py-2" /></label><button className="rounded-lg border px-4 py-2">اعمال فیلتر</button></form>
    <div className="overflow-x-auto rounded-xl border"><table className="w-full text-right text-sm"><thead className="bg-muted"><tr><th className="p-3">عنوان</th><th className="p-3">دسته</th><th className="p-3">وضعیت</th><th className="p-3">نویسنده</th><th className="p-3">آخرین ویرایش</th><th className="p-3">عملیات</th></tr></thead><tbody>{posts.map(post => <tr key={post.id} className="border-t"><td className="p-3 font-medium"><Link href={`/admin/blog/${post.id}`} className="hover:text-primary">{post.title}</Link><span dir="ltr" className="block text-xs text-muted-foreground">{post.slug}</span></td><td className="p-3">{post.category?.name || "—"}</td><td className="p-3">{post.status === "SCHEDULED" && post.publishedAt && post.publishedAt <= new Date() ? "منتشر شده (زمان‌بندی)" : labels[post.status]}</td><td className="p-3">{post.author.username}</td><td className="p-3">{blogDate(post.updatedAt)}</td><td className="flex gap-2 p-3"><Link href={`/admin/blog/${post.id}`} className="text-primary">ویرایش</Link><Link href={`/admin/blog/${post.id}/preview`}>پیش‌نمایش</Link><DuplicateButton id={post.id} />{post.status !== "ARCHIVED" && <ArchiveButton id={post.id} />}</td></tr>)}{!posts.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">مقاله‌ای پیدا نشد.</td></tr>}</tbody></table></div>
    {total > 20 && <nav className="flex justify-center gap-4">{page > 1 && <Link href={pageHref(page - 1)}>صفحه قبل</Link>}<span>{page} از {Math.ceil(total / 20)}</span>{page * 20 < total && <Link href={pageHref(page + 1)}>صفحه بعد</Link>}</nav>}
  </div>;
}
