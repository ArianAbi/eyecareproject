import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { absoluteBlogUrl, blogCardSelect, blogDate, getPublishedBlogPost, publishedBlogWhere } from "@/lib/blog";
import { BlogContent, blogHeadings } from "@/components/blog/BlogContent";
import { normalizeBlogContent, readingMinutes, faqSchema } from "@/lib/blog-content";
import { BlogCard } from "@/components/blog/BlogCard";
import { getSettings } from "@/lib/settings";
import { mediaFilename } from "@/lib/media";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) return { title: "مقاله یافت نشد", robots: { index: false } };
  const image = post.ogImage || post.coverImage;
  const title = post.seoTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const url = `/blog/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl || url },
    robots: { index: !post.noindex, follow: !post.noindex },
    openGraph: { title: post.ogTitle || title, description: post.ogDescription || description, type: "article", url, locale: "fa_IR", publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(), images: image ? [{ url: image, alt: post.coverAlt || post.title }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title: post.ogTitle || title, description: post.ogDescription || description, images: image ? [image] : undefined },
  };
}

export default async function BlogArticle({ params }: Props) {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) notFound();
  const content = normalizeBlogContent(post.content);
  const headings = blogHeadings(content);
  const faqs = faqSchema.safeParse(post.faq).data ?? [];
  const settings = await getSettings();
  const coverFilename = post.coverImage ? mediaFilename(post.coverImage) : null;
  const coverMedia = coverFilename ? await prisma.mediaAsset.findUnique({ where: { filename: coverFilename }, select: { title: true, altText: true, description: true, keywords: true, width: true, height: true } }) : null;
  const related = await prisma.blogPost.findMany({ where: { AND: [publishedBlogWhere(), { id: { not: post.id } }, ...(post.categoryId ? [{ categoryId: post.categoryId }] : [])] }, select: blogCardSelect, orderBy: { publishedAt: "desc" }, take: 3 });
  const url = post.canonicalUrl || absoluteBlogUrl(`/blog/${post.slug}`);
  const schemas = [
    { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, mainEntityOfPage: url, url, image: post.coverImage ? [{ "@type": "ImageObject", contentUrl: absoluteBlogUrl(post.coverImage), name: coverMedia?.title || post.title, description: coverMedia?.description || post.coverAlt || undefined, caption: post.coverAlt || coverMedia?.altText || undefined, width: coverMedia?.width || undefined, height: coverMedia?.height || undefined, keywords: coverMedia?.keywords.join(", ") || undefined }] : undefined, datePublished: post.publishedAt?.toISOString(), dateModified: post.updatedAt.toISOString(), inLanguage: "fa-IR", author: { "@type": "Person", name: post.author.username }, publisher: { "@type": "Organization", name: settings.siteName }, articleSection: post.category?.name, keywords: post.tags.map(tag => tag.name).join(", ") },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "خانه", item: absoluteBlogUrl("/") }, { "@type": "ListItem", position: 2, name: "مجله", item: absoluteBlogUrl("/blog") }, { "@type": "ListItem", position: 3, name: post.title, item: absoluteBlogUrl(`/blog/${post.slug}`) }] },
    ...(faqs.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }] : []),
  ];
  return <main className="mx-auto w-full max-w-5xl px-4 py-10">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, "\\u003c") }} />
    <nav aria-label="مسیر صفحه" className="mb-6 text-sm text-muted-foreground"><Link href="/">خانه</Link> / <Link href="/blog">مجله</Link> / {post.title}</nav>
    <article className="mx-auto max-w-3xl">
      {post.category && <Link href={`/blog/category/${post.category.slug}`} className="text-sm text-primary">{post.category.name}</Link>}
      <h1 className="mt-3 text-3xl font-bold leading-relaxed md:text-4xl">{post.title}</h1>
      <p className="mt-4 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground"><span>نویسنده: {post.author.username}</span>{post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>انتشار: {blogDate(post.publishedAt)}</time>}<time dateTime={post.updatedAt.toISOString()}>به‌روزرسانی: {blogDate(post.updatedAt)}</time><span>{readingMinutes(content)} دقیقه مطالعه</span></div>
      {post.coverImage && <Image src={post.coverImage} alt={post.coverAlt || post.title} width={1200} height={675} sizes="(max-width: 768px) 100vw, 768px" className="mt-8 aspect-video w-full rounded-2xl object-cover" />}
      {headings.length > 2 && <nav aria-label="فهرست مقاله" className="my-8 rounded-xl border bg-card p-5"><h2 className="mb-3 font-semibold">در این مقاله</h2><ol className="space-y-2">{headings.map(item => <li key={item.id} className={item.level > 2 ? "pr-4" : ""}><a href={`#${item.id}`} className="hover:text-primary">{item.text}</a></li>)}</ol></nav>}
      <div className="mt-8"><BlogContent content={content} /></div>
      {faqs.length > 0 && <section className="mt-10"><h2 className="mb-5 text-2xl font-bold">پرسش‌های متداول</h2><dl className="space-y-5">{faqs.map(item => <div key={item.question} className="rounded-xl border p-5"><dt className="font-semibold">{item.question}</dt><dd className="mt-2 leading-8 text-muted-foreground">{item.answer}</dd></div>)}</dl></section>}
      {post.tags.length > 0 && <nav aria-label="برچسب‌های مقاله" className="mt-8 flex flex-wrap gap-2">{post.tags.map(tag => <Link key={tag.id} href={`/blog/tag/${tag.slug}`} className="rounded-full border px-3 py-1 text-sm">#{tag.name}</Link>)}</nav>}
    </article>
    {related.length > 0 && <section className="mt-16"><h2 className="mb-6 text-2xl font-semibold">مقاله‌های مرتبط</h2><div className="grid gap-5 md:grid-cols-3">{related.map(item => <BlogCard key={item.id} post={item} />)}</div></section>}
  </main>;
}
