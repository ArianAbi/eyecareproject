# Blog publishing guide

Added 2026-09-29. This document describes the implementation in this checkout, not a live deployment.

## Routes and workflow

- Public: `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`.
- Admin: `/admin/blog`, `/admin/blog/create`, `/admin/blog/[id]`, `/admin/blog/[id]/preview`, `/admin/blog/terms`.
- Admin list supports title, status, category, publication-date filters and pagination. Editors can save drafts, publish, schedule, archive, duplicate and privately preview posts. Category/tag names and slugs can be created and edited; unused terms can be deleted. A term slug is locked while posts use it.
- The public home page shows three recent indexable posts when any exist. The site header, signed-in user sidebar and admin sidebar link to the blog.
- Draft and archived posts have no public article page. Scheduled posts become public when `publishedAt` passes. The stored status remains `SCHEDULED`; no background worker changes it. Admin previews require admin access and are marked noindex.
- A published or scheduled post's slug is locked to avoid breaking indexed URLs. Copying creates a draft with a unique `-copy` slug and noindex enabled. Archive removes a post from public listings and sitemap; it does not delete its record or audit history. A post can be restored by changing its status in the editor.

## Writing and media

Within a table cell, the editor toolbar offers add/delete row, add/delete column, and delete-table actions. Table controls are disabled when the cursor is outside a table.

The admin editor uses Tiptap. Its icon toolbar stays at the top of the viewport while the article body is in view. It supports H2-H4 headings, inline styles, bullet/numbered lists, quotes, links, code blocks, tables, alignment, horizontal rules, undo/redo, and images with required alt text and optional caption. The page title provides the only H1. The writing column holds the title, excerpt, body and FAQs; the side column groups publication, URL slug, category/tags, cover and search appearance. New slugs follow the title until manually edited; published/scheduled slugs are locked. Basic SEO fields have a search-result preview, while social and canonical overrides are in an advanced section. Article body is stored as Tiptap JSON and parsed through an allowlist before saving and server rendering. The client serializes the form to JSON before calling the save action, then the server parses and validates it; this keeps Tiptap node attributes from crossing the React client/server boundary as temporary references. Published/scheduled posts require an excerpt, meta description and at least 80 characters of body text.

Blog images use the existing Sharp compression pipeline and the public `MediaAsset` library at `/admin/media`; the `/api/blog/images/[filename]` serving route remains stable. The reusable picker selects existing images or uploads new ones with title, alt text, description and keywords. The editor uses the selected alt text for inline and cover images; cover metadata also contributes to `ImageObject` structured data. Only admins can upload. Input is capped at 5 MiB and converted to WebP. The media quota is 300 images or 300 MiB per admin account, with a rate limit. Images are public as soon as uploaded; do not upload private material. Unused images remain in the library until deleted. The `IMAGE_UPLOAD_DIR` must point to durable storage in production, shared by all app instances. Keep that directory backed up with the database. See [media library](MEDIA.md).

## SEO and AI discovery

Every public article is server rendered with a title, excerpt, optional cover, author, publish/update dates, headings with stable anchors, reading time, optional table of contents, visible FAQs, tags and related articles. Its metadata includes canonical URL, robots directive, Open Graph and Twitter fields. Article JSON-LD (`BlogPosting`), breadcrumbs and FAQ JSON-LD are emitted where the matching content is visible. Admins can edit SEO/social fields, cover alt text, canonical URL and noindex; the editor shows a search-result preview and missing-field hints.

`/sitemap.xml` is dynamic and lists live, indexable posts and their nonempty category/tag archives. `/robots.txt` permits `/blog` and the public blog image route while excluding admin and private paths. `noindex` posts remain readable by URL but are omitted from the sitemap. Search and later pagination pages are noindex. Search-result ranking and AI citations depend on content quality and external crawlers; metadata alone cannot guarantee either.

For useful SEO/GEO content, put a direct answer in the excerpt and opening paragraph; use accurate question-based headings, original facts, cited sources and visible answers. Keep product/medical claims reviewed and update dates honest. Avoid adding FAQ entries that are not displayed to readers.

## Data and deployment

The models are in `prisma/schema.prisma`; migration `20260929120000_blog` adds the tables and `BlogPostStatus` enum. Deploy the migration before opening the new routes. The production build script runs `prisma migrate deploy` only when `VERCEL_ENV=production`; otherwise run the normal migration deployment command for your environment, then regenerate the Prisma client. Set `APP_URL` to the site's public HTTPS origin so absolute sitemap and structured-data URLs are correct.

Admin writes live in `lib/actions/admin.blog.actions.ts`; upload is in `lib/actions/admin.blog-images.actions.ts`; public visibility and URL helpers are in `lib/blog.ts`; Tiptap validation is in `lib/blog-content.ts`. Blog actions authorize independently of the admin layout, validate input on the server, audit writes transactionally and revalidate blog/sitemap paths after commit.

Public article, category, and tag lookups normalize percent-encoded Unicode route segments before comparing them with stored slugs, so Persian URLs work both from links and when copied from the address bar.
