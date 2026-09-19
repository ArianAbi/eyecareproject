import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const origin = process.env.APP_URL || 'http://localhost:3000'
    return {
        rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/orders', '/invoices', '/tickets', '/glasslens-order', '/login', '/signup'] },
        sitemap: new URL('/sitemap.xml', origin).toString()
    }
}
