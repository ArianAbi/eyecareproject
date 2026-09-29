import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import { BlogPostForm, emptyBlogPost } from "../BlogPostForm";

export default async function CreateBlogPost() {
  await requireAdmin();
  const [categories, tags] = await Promise.all([prisma.blogCategory.findMany({ orderBy: { name: "asc" } }), prisma.blogTag.findMany({ orderBy: { name: "asc" } })]);
  return <main><BlogPostForm initial={emptyBlogPost} categories={categories} tags={tags} /></main>;
}
