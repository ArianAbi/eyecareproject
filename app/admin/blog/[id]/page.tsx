import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/access";
import { normalizeBlogContent, faqSchema } from "@/lib/blog-content";
import prisma from "@/lib/db";
import { BlogPostForm } from "../BlogPostForm";

export default async function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = (await params).id;
  const [post, categories, tags] = await Promise.all([prisma.blogPost.findUnique({ where: { id }, include: { tags: true } }), prisma.blogCategory.findMany({ orderBy: { name: "asc" } }), prisma.blogTag.findMany({ orderBy: { name: "asc" } })]);
  if (!post) notFound();
  return <main><BlogPostForm id={id} categories={categories} tags={tags} initial={{ title: post.title, slug: post.slug, excerpt: post.excerpt, content: normalizeBlogContent(post.content), status: post.status === "SCHEDULED" && post.publishedAt && post.publishedAt <= new Date() ? "PUBLISHED" : post.status, publishedAt: post.publishedAt?.toISOString() || null, featured: post.featured, coverImage: post.coverImage, coverAlt: post.coverAlt || "", seoTitle: post.seoTitle || "", metaDescription: post.metaDescription || "", canonicalUrl: post.canonicalUrl || "", ogTitle: post.ogTitle || "", ogDescription: post.ogDescription || "", ogImage: post.ogImage || "", noindex: post.noindex, faq: faqSchema.safeParse(post.faq).data || [], categoryId: post.categoryId, tagIds: post.tags.map(tag => tag.id) }} /></main>;
}
