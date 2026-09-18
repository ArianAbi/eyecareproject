import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [{ url: new URL('/', process.env.APP_URL || 'http://localhost:3000').toString(), changeFrequency: 'weekly', priority: 1 }]
}
