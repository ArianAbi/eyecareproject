import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/db";
import { blogCardSelect, publishedBlogWhere } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";

const baseMetadata: Metadata = {
  title: "مجله و آموزش چشم و عینک",
  description: "مقالات کاربردی درباره عدسی عینک، مراقبت از چشم و انتخاب محصولات اپتیک.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "مجله چشم و عینک", description: "آموزش و راهنمای عدسی و اپتیک", url: "/blog", type: "website", locale: "fa_IR" },
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }): Promise<Metadata> {
  const { page, q } = await searchParams;
  return { ...baseMetadata, ...(q || (Number(page) || 1) > 1 ? { robots: { index: false, follow: true } } : {}) };
}

export default async function BlogIndex({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  const q = (params.q || "").trim().slice(0, 100);
  const where = { AND: [publishedBlogWhere(), ...(q ? [{ OR: [{ title: { contains: q, mode: "insensitive" as const } }, { excerpt: { contains: q, mode: "insensitive" as const } }] }] : [])] };
  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({ where, select: blogCardSelect, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 12, skip: (page - 1) * 12 }),
    prisma.blogPost.count({ where }),
    prisma.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  const href = (nextPage: number) => `/blog?${new URLSearchParams({ ...(q ? { q } : {}), page: String(nextPage) })}`;
  return <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
    <header className="space-y-3"><h1 className="text-3xl font-bold">مجله چشم و عینک</h1><p className="text-muted-foreground">راهنماها و مقاله‌های کاربردی برای انتخاب و شناخت عدسی و محصولات اپتیک.</p></header>
    <form action="/blog" className="flex max-w-xl gap-2"><input name="q" defaultValue={q} aria-label="جستجوی مقاله" placeholder="جستجوی مقاله…" maxLength={100} className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2" /><button className="rounded-lg bg-primary px-5 py-2 text-primary-foreground">جستجو</button></form>
    {categories.length > 0 && <nav aria-label="دسته‌های وبلاگ" className="flex flex-wrap gap-2">{categories.map(category => <Link key={category.id} href={`/blog/category/${category.slug}`} className="rounded-full border px-3 py-1 text-sm hover:border-primary">{category.name}</Link>)}</nav>}
    {posts.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map(post => <BlogCard key={post.id} post={post} />)}</div> : <p className="rounded-xl border p-8 text-muted-foreground">مقاله‌ای پیدا نشد.</p>}
    {total > 12 && <nav aria-label="صفحه‌بندی مقالات" className="flex justify-center gap-4">{page > 1 && <Link href={href(page - 1)} className="rounded-lg border px-4 py-2">صفحه قبل</Link>}<span className="px-2 py-2">{page} از {Math.ceil(total / 12)}</span>{page * 12 < total && <Link href={href(page + 1)} className="rounded-lg border px-4 py-2">صفحه بعد</Link>}</nav>}
  </main>;
}
