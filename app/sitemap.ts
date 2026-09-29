import type { MetadataRoute } from 'next'
import prisma from '@/lib/db'
import { absoluteBlogUrl, publishedBlogWhere } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const indexable = { AND: [publishedBlogWhere(), { noindex: false }] }
    const [posts, categories, tags] = await Promise.all([
        prisma.blogPost.findMany({ where: indexable, select: { slug: true, updatedAt: true } }),
        prisma.blogCategory.findMany({ where: { posts: { some: indexable } }, select: { slug: true } }),
        prisma.blogTag.findMany({ where: { posts: { some: indexable } }, select: { slug: true } }),
    ])
    return [
        { url: absoluteBlogUrl('/'), changeFrequency: 'weekly', priority: 1 },
        { url: absoluteBlogUrl('/blog'), changeFrequency: 'daily', priority: 0.8 },
        ...categories.map(category => ({ url: absoluteBlogUrl(`/blog/category/${category.slug}`), changeFrequency: 'weekly' as const, priority: 0.6 })),
        ...tags.map(tag => ({ url: absoluteBlogUrl(`/blog/tag/${tag.slug}`), changeFrequency: 'weekly' as const, priority: 0.5 })),
        ...posts.map(post => ({ url: absoluteBlogUrl(`/blog/${post.slug}`), lastModified: post.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ]
}
