import Link from "next/link";
import { BlogCard } from "@/components/blog/BlogCard";
import { blogCardSelect, publishedBlogWhere } from "@/lib/blog";
import prisma from "@/lib/db";

export async function BlogArchive({ kind, slug, page }: { kind: "category" | "tag"; slug: string; page: number }) {
  const term = kind === "category" ? await prisma.blogCategory.findUnique({ where: { slug } }) : await prisma.blogTag.findUnique({ where: { slug } });
  if (!term) return null;
  const where = { AND: [publishedBlogWhere(), kind === "category" ? { categoryId: term.id } : { tags: { some: { id: term.id } } }] };
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, select: blogCardSelect, orderBy: { publishedAt: "desc" }, take: 12, skip: (page - 1) * 12 }),
    prisma.blogPost.count({ where }),
  ]);
  const root = `/blog/${kind}/${slug}`;
  return <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10"><nav className="text-sm text-muted-foreground"><Link href="/blog">مجله</Link> / {term.name}</nav><h1 className="text-3xl font-bold">{term.name}</h1>{posts.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map(post => <BlogCard key={post.id} post={post} />)}</div> : <p className="rounded-xl border p-8">هنوز مقاله‌ای در این بخش منتشر نشده است.</p>}{total > 12 && <nav aria-label="صفحه‌بندی" className="flex justify-center gap-4">{page > 1 && <Link href={`${root}?page=${page - 1}`}>صفحه قبل</Link>}<span>{page} از {Math.ceil(total / 12)}</span>{page * 12 < total && <Link href={`${root}?page=${page + 1}`}>صفحه بعد</Link>}</nav>}</main>;
}
