import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import { BlogContent } from "@/components/blog/BlogContent";
import { faqSchema } from "@/lib/blog-content";

export const metadata = { title: "پیش‌نمایش مقاله", robots: { index: false, follow: false } };

export default async function BlogPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id: (await params).id }, include: { author: { select: { username: true } } } });
  if (!post) notFound();
  const faqs = faqSchema.safeParse(post.faq).data || [];
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-10"><div className="flex items-center justify-between rounded-xl border border-amber-500 p-4"><span>پیش‌نمایش خصوصی · {post.status}</span><Link href={`/admin/blog/${post.id}`} className="text-primary">بازگشت به ویرایش</Link></div><article><h1 className="text-3xl font-bold">{post.title}</h1><p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p><p className="mt-3 text-sm text-muted-foreground">{post.author.username}</p>{post.coverImage && <Image src={post.coverImage} alt={post.coverAlt || post.title} width={1200} height={675} className="mt-6 aspect-video w-full rounded-xl object-cover" />}<div className="mt-8"><BlogContent content={post.content} /></div>{faqs.length > 0 && <section className="mt-8"><h2 className="text-2xl font-bold">پرسش‌های متداول</h2>{faqs.map(item => <div key={item.question} className="mt-4"><h3 className="font-semibold">{item.question}</h3><p>{item.answer}</p></div>)}</section>}</article></main>;
}
