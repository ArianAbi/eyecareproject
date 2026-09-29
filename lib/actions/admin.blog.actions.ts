"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { actionResult, ExpectedError } from "@/lib/action-result";
import { requireAdmin } from "@/lib/access";
import { writeAudit } from "@/lib/audit";
import { blogPostSchema, type BlogPostInput } from "@/lib/blog-content";
import prisma from "@/lib/db";
import { z } from "zod";

function invalidateBlog(slug?: string, previousSlug?: string) {
  revalidatePath("/blog", "layout");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
  revalidatePath("/admin/blog");
}

const termSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u),
});

export async function saveBlogPost(serializedInput: string, id?: string) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    if (id) z.string().uuid().parse(id);
    if (typeof serializedInput !== "string" || serializedInput.length > 250_000) throw new ExpectedError("Article content is too long or invalid.");
    let input: BlogPostInput;
    try { input = JSON.parse(serializedInput) as BlogPostInput; }
    catch { throw new ExpectedError("Article content is invalid."); }
    const parsed = blogPostSchema.safeParse(input);
    if (!parsed.success) throw new ExpectedError(parsed.error.issues[0]?.message || "Check the post fields.");
    const data = parsed.data;
    if (await prisma.blogPost.findFirst({ where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } })) throw new ExpectedError("This URL slug is already in use.");
    const existing = id ? await prisma.blogPost.findUnique({ where: { id }, select: { slug: true, publishedAt: true, status: true } }) : null;
    if (id && !existing) throw new ExpectedError("Post not found.");
    if (existing && ["PUBLISHED", "SCHEDULED"].includes(existing.status) && existing.slug !== data.slug) throw new ExpectedError("The URL slug of a published or scheduled post cannot be changed.");
    const publishedAt = data.status === "DRAFT" || data.status === "ARCHIVED" ? null
      : data.status === "SCHEDULED" ? new Date(data.publishedAt!)
      : existing?.publishedAt && existing.publishedAt <= new Date() ? existing.publishedAt : new Date();
    const { categoryId, tagIds, faq, content, ...rest } = data;
    const saved = await prisma.$transaction(async tx => {
      const values = {
        ...rest,
        publishedAt,
        coverImage: rest.coverImage || null,
        coverAlt: rest.coverAlt || null,
        seoTitle: rest.seoTitle || null,
        metaDescription: rest.metaDescription || null,
        canonicalUrl: rest.canonicalUrl || null,
        ogTitle: rest.ogTitle || null,
        ogDescription: rest.ogDescription || null,
        ogImage: rest.ogImage || null,
        content: content as Prisma.InputJsonValue,
        faq: faq as Prisma.InputJsonValue,
        category: categoryId ? { connect: { id: categoryId } } : { disconnect: true },
        tags: { set: tagIds.map(tagId => ({ id: tagId })) },
      };
      const post = id
        ? await tx.blogPost.update({ where: { id }, data: values })
        : await tx.blogPost.create({ data: { ...values, category: categoryId ? { connect: { id: categoryId } } : undefined, tags: { connect: tagIds.map(tagId => ({ id: tagId })) }, author: { connect: { id: actor.id } } } });
      await writeAudit(tx, actor.id, id ? "BLOG_POST_UPDATED" : "BLOG_POST_CREATED", "BlogPost", post.id, `${post.slug} | ${post.status}`);
      return post;
    });
    invalidateBlog(saved.slug, existing?.slug);
    return { success: true as const, id: saved.id, slug: saved.slug };
  });
}

export async function archiveBlogPost(id: string) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    z.string().uuid().parse(id);
    const post = await prisma.$transaction(async tx => {
      const updated = await tx.blogPost.update({ where: { id }, data: { status: "ARCHIVED", publishedAt: null } });
      await writeAudit(tx, actor.id, "BLOG_POST_ARCHIVED", "BlogPost", id, updated.slug);
      return updated;
    });
    invalidateBlog(post.slug);
    return { success: true as const };
  });
}

export async function duplicateBlogPost(id: string) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    z.string().uuid().parse(id);
    const original = await prisma.blogPost.findUnique({ where: { id }, include: { tags: true } });
    if (!original) throw new ExpectedError("Post not found.");
    const base = `${original.slug}-copy`;
    let slug = base;
    let suffix = 2;
    while (await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${suffix++}`;
    const copy = await prisma.$transaction(async tx => {
      const saved = await tx.blogPost.create({ data: {
        slug, title: `${original.title} (کپی)`, excerpt: original.excerpt, content: original.content as Prisma.InputJsonValue,
        status: "DRAFT", featured: false, coverImage: original.coverImage, coverAlt: original.coverAlt,
        seoTitle: original.seoTitle, metaDescription: original.metaDescription, canonicalUrl: null,
        ogTitle: original.ogTitle, ogDescription: original.ogDescription, ogImage: original.ogImage,
        noindex: true, faq: original.faq === null ? Prisma.JsonNull : original.faq as Prisma.InputJsonValue,
        author: { connect: { id: actor.id } },
        ...(original.categoryId ? { category: { connect: { id: original.categoryId } } } : {}),
        tags: { connect: original.tags.map(tag => ({ id: tag.id })) },
      } });
      await writeAudit(tx, actor.id, "BLOG_POST_DUPLICATED", "BlogPost", saved.id, original.id);
      return saved;
    });
    revalidatePath("/admin/blog");
    return { success: true as const, id: copy.id };
  });
}

export async function saveBlogTerm(kind: "category" | "tag", input: { name: string; slug: string }, id?: string) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    const term = termSchema.parse(input);
    if (id) z.string().uuid().parse(id);
    const duplicate = kind === "category"
      ? await prisma.blogCategory.findFirst({ where: { slug: term.slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } })
      : await prisma.blogTag.findFirst({ where: { slug: term.slug, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
    if (duplicate) throw new ExpectedError("This URL slug is already in use.");
    const saved = await prisma.$transaction(async tx => {
      if (id) {
        const previous = kind === "category"
          ? await tx.blogCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { posts: true } } } })
          : await tx.blogTag.findUniqueOrThrow({ where: { id }, include: { _count: { select: { posts: true } } } });
        if (previous._count.posts && previous.slug !== term.slug) throw new ExpectedError("Move or remove linked posts before changing this URL slug.");
      }
      const result = kind === "category"
        ? id ? await tx.blogCategory.update({ where: { id }, data: term }) : await tx.blogCategory.create({ data: term })
        : id ? await tx.blogTag.update({ where: { id }, data: term }) : await tx.blogTag.create({ data: term });
      await writeAudit(tx, actor.id, id ? "BLOG_TERM_UPDATED" : "BLOG_TERM_CREATED", kind === "category" ? "BlogCategory" : "BlogTag", result.id, result.slug);
      return result;
    });
    invalidateBlog();
    return { success: true as const, id: saved.id };
  });
}

export async function deleteBlogTerm(kind: "category" | "tag", id: string) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    z.string().uuid().parse(id);
    await prisma.$transaction(async tx => {
      if (kind === "category") {
        const item = await tx.blogCategory.findUniqueOrThrow({ where: { id }, include: { _count: { select: { posts: true } } } });
        if (item._count.posts) throw new ExpectedError("This category is in use. Move its posts first.");
        await tx.blogCategory.delete({ where: { id } });
        await writeAudit(tx, actor.id, "BLOG_TERM_DELETED", "BlogCategory", id, item.slug);
      } else {
        const item = await tx.blogTag.findUniqueOrThrow({ where: { id }, include: { _count: { select: { posts: true } } } });
        if (item._count.posts) throw new ExpectedError("This tag is in use. Remove it from posts first.");
        await tx.blogTag.delete({ where: { id } });
        await writeAudit(tx, actor.id, "BLOG_TERM_DELETED", "BlogTag", id, item.slug);
      }
    });
    invalidateBlog();
    return { success: true as const };
  });
}
