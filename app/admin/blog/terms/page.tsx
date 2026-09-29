import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import { BlogTermForm } from "./BlogTermForm";

export default async function BlogTermsPage() {
  await requireAdmin();
  const [categories, tags] = await Promise.all([prisma.blogCategory.findMany({ orderBy: { name: "asc" } }), prisma.blogTag.findMany({ orderBy: { name: "asc" } })]);
  return <main className="space-y-8"><h1 className="text-2xl font-bold">دسته‌ها و برچسب‌های وبلاگ</h1><div className="grid gap-6 md:grid-cols-2"><section className="space-y-4 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">دسته‌ها</h2><BlogTermForm kind="category" /><div className="space-y-3">{categories.map(item => <div key={item.id} className="rounded-lg border p-3"><BlogTermForm kind="category" item={item} /></div>)}</div></section><section className="space-y-4 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">برچسب‌ها</h2><BlogTermForm kind="tag" /><div className="space-y-3">{tags.map(item => <div key={item.id} className="rounded-lg border p-3"><BlogTermForm kind="tag" item={item} /></div>)}</div></section></div></main>;
}
