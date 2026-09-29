const { test } = require('node:test')
const assert = require('node:assert/strict')
const { pathToFileURL } = require('node:url')
const path = require('node:path')

const modulePromise = import(pathToFileURL(path.join(__dirname, '..', 'lib', 'blog-content.ts')).href)

test('blog content strips unsupported attributes and rejects unsafe links and images', async () => {
  const { normalizeBlogContent } = await modulePromise
  const clean = normalizeBlogContent({ type: 'doc', content: [{ type: 'paragraph', attrs: { onclick: 'bad' }, content: [{ type: 'text', text: 'Safe', marks: [{ type: 'link', attrs: { href: 'https://example.com', onclick: 'bad' } }] }] }] })
  assert.deepEqual(clean.content[0].attrs, undefined)
  assert.deepEqual(clean.content[0].content[0].marks, [{ type: 'link', attrs: { href: 'https://example.com' } }])
  assert.throws(() => normalizeBlogContent({ type: 'doc', content: [{ type: 'text', text: 'bad', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }))
  assert.throws(() => normalizeBlogContent({ type: 'doc', content: [{ type: 'image', attrs: { src: '/api/images/private.webp', alt: 'private' } }] }))
  assert.throws(() => normalizeBlogContent({ type: 'doc', content: [{ type: 'image', attrs: { src: '/api/blog/images/00000000-0000-0000-0000-000000000000.webp', alt: '' } }] }))
})

test('published posts require useful body and SEO summary; scheduled posts need a future date', async () => {
  const { blogPostSchema } = await modulePromise
  const base = {
    title: 'Guide to optical lenses', slug: 'optical-lenses', excerpt: 'A practical answer about optical lenses.',
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A useful article explains optical lens materials, coatings, fit, and care in enough detail for readers.' }] }] },
    status: 'PUBLISHED', publishedAt: null, featured: false, coverImage: null, coverAlt: '', seoTitle: '',
    metaDescription: 'A practical guide to optical lenses and how to choose them.', canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '',
    noindex: false, faq: [], categoryId: null, tagIds: [],
  }
  assert.equal(blogPostSchema.safeParse(base).success, true)
  assert.equal(blogPostSchema.safeParse({ ...base, content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Short' }] }] } }).success, false)
  assert.equal(blogPostSchema.safeParse({ ...base, metaDescription: '' }).success, false)
  assert.equal(blogPostSchema.safeParse({ ...base, status: 'SCHEDULED', publishedAt: '2000-01-01T00:00:00.000Z' }).success, false)
})

test('serialized Tiptap attributes become plain objects before server validation', async () => {
  const { normalizeBlogContent } = await modulePromise
  const attrs = Object.create(null)
  attrs.level = 2
  const editorContent = { type: 'doc', content: [{ type: 'heading', attrs, content: [{ type: 'text', text: 'Lens care' }] }] }
  const serializedContent = JSON.parse(JSON.stringify(editorContent))
  assert.equal(Object.getPrototypeOf(serializedContent.content[0].attrs), Object.prototype)
  assert.equal(normalizeBlogContent(serializedContent).content[0].attrs.level, 2)
})
