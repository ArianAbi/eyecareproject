import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { BlogArchive } from "@/components/blog/BlogArchive";
import { normalizeBlogSlug } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = normalizeBlogSlug((await params).slug);
  const term = slug ? await prisma.blogTag.findUnique({ where: { slug } }) : null;
  return term ? { title: `مقالات با برچسب ${term.name}`, description: `مقالات مرتبط با ${term.name}`, alternates: { canonical: `/blog/tag/${term.slug}` }, ...((Number((await searchParams).page) || 1) > 1 ? { robots: { index: false, follow: true } } : {}) } : { robots: { index: false } };
}
export default async function BlogTagPage({ params, searchParams }: Props) {
  const slug = normalizeBlogSlug((await params).slug);
  if (!slug) notFound();
  const page = Math.max(1, Math.min(10000, Number.parseInt((await searchParams).page || "1", 10) || 1));
  const archive = await BlogArchive({ kind: "tag", slug, page });
  if (!archive) notFound();
  return archive;
}
