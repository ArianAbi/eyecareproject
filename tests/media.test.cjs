const { test } = require('node:test')
const assert = require('node:assert/strict')
const { pathToFileURL } = require('node:url')
const path = require('node:path')

const mediaPromise = import(pathToFileURL(path.join(__dirname, '..', 'lib', 'media.ts')).href)

test('media metadata validates useful alt text and bounded keywords', async () => {
  const { mediaMetadataSchema, parseMediaKeywords } = await mediaPromise
  assert.deepEqual(parseMediaKeywords('عدسی، عینک, عدسی'), ['عدسی', 'عینک'])
  assert.equal(mediaMetadataSchema.safeParse({ title: 'عدسی طبی', altText: 'نمای نزدیک عدسی روی میز', description: '', keywords: ['عدسی'] }).success, true)
  assert.equal(mediaMetadataSchema.safeParse({ title: 'x', altText: '', description: '', keywords: [] }).success, false)
  assert.equal(mediaMetadataSchema.safeParse({ title: 'عنوان تصویر', altText: 'توضیح تصویر', description: '', keywords: Array(13).fill('tag') }).success, false)
})

test('media filenames are restricted to the public image route', async () => {
  const { mediaFilename, mediaUrl } = await mediaPromise
  const filename = '00000000-0000-0000-0000-000000000000.webp'
  assert.equal(mediaFilename(mediaUrl(filename)), filename)
  assert.equal(mediaFilename('/api/images/' + filename), null)
  assert.equal(mediaFilename('/api/blog/images/../private.webp'), null)
})
