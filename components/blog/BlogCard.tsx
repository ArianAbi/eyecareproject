import Image from "next/image";
import Link from "next/link";
import { blogDate } from "@/lib/blog";

export function BlogCard({ post }: { post: { slug: string; title: string; excerpt: string; coverImage: string | null; coverAlt: string | null; publishedAt: Date | null; category: { name: string; slug: string } | null } }) {
  return <article className="overflow-hidden rounded-2xl border bg-card">
    {post.coverImage && <Link href={`/blog/${post.slug}`}><Image src={post.coverImage} alt={post.coverAlt || post.title} width={800} height={450} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-video w-full object-cover" /></Link>}
    <div className="space-y-3 p-5">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">{post.category && <Link href={`/blog/category/${post.category.slug}`} className="text-primary hover:underline">{post.category.name}</Link>}{post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{blogDate(post.publishedAt)}</time>}</div>
      <h2 className="text-xl font-semibold"><Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link></h2>
      <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
      <Link href={`/blog/${post.slug}`} className="inline-block text-sm text-primary hover:underline">مطالعه مقاله ←</Link>
    </div>
  </article>;
}
