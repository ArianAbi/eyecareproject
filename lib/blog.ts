import prisma from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const blogCardSelect = {
  id: true, slug: true, title: true, excerpt: true, coverImage: true, coverAlt: true, publishedAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.BlogPostSelect;

export const publishedBlogWhere = (): Prisma.BlogPostWhereInput => ({
  OR: [
    { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    { status: "SCHEDULED", publishedAt: { lte: new Date() } },
  ],
});

// Next can supply percent-encoded dynamic segments for non-ASCII slugs.
export function normalizeBlogSlug(slug: string): string | null {
  try {
    const decoded = decodeURIComponent(slug);
    return decoded.length <= 180 && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export async function getPublishedBlogPost(slug: string) {
  const normalizedSlug = normalizeBlogSlug(slug);
  if (!normalizedSlug) return null;
  return prisma.blogPost.findFirst({
    where: { slug: normalizedSlug, ...publishedBlogWhere() },
    include: { author: { select: { username: true } }, category: true, tags: true },
  });
}

export const blogOrigin = () => new URL(process.env.APP_URL || "http://localhost:3000");
export const absoluteBlogUrl = (path: string) => new URL(path, blogOrigin()).toString();

export function blogDate(value: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(value);
}
