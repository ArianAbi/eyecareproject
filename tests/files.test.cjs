const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load-ts.cjs');

const filename = '20000000-0000-4000-8000-000000000001.pdf';

test('file URL and visibility policy reject traversal and user public uploads', () => {
  class InvalidImageError extends Error {}
  const files = load('lib/file-upload.ts', {
    'lib/image-storage': { InvalidImageError },
    'lib/image-upload': { MAX_IMAGE_BYTES: 5 * 1024 * 1024 },
  });
  assert.equal(files.parseFileUrl(`/api/files/${filename}`), filename);
  assert.equal(files.parseFileUrl('/api/files/../secret.pdf'), null);
  assert.equal(files.resolveUploadVisibility(undefined, false), 'PRIVATE');
  assert.equal(files.resolveUploadVisibility('PUBLIC', true), 'PUBLIC');
  assert.throws(() => files.resolveUploadVisibility('PUBLIC', false), InvalidImageError);
  assert.equal(files.isPdf(Buffer.from('%PDF-1.7\ncontent\n%%EOF')), true);
  assert.equal(files.isPdf(Buffer.from('not a pdf')), false);
});

test('file route serves public anonymously but restricts private files to owner/admin', async () => {
  let reads = 0;
  for (const [visibility, role, status] of [
    ['PUBLIC', 'anonymous', 200], ['PRIVATE', 'anonymous', 401],
    ['PRIVATE', 'stranger', 404], ['PRIVATE', 'owner', 200], ['PRIVATE', 'admin', 200],
  ]) {
    const route = load('app/api/files/[filename]/route.ts', {
      'lib/Auth': { auth: async () => role === 'anonymous' ? null : { user: { id: role === 'owner' ? 'owner' : 'other' } } },
      'lib/db': { imageAsset: { findUnique: async () => ({ ownerId: 'owner', visibility }) }, user: { findUnique: async () => ({ admin: role === 'admin' }) } },
      'lib/file-upload': { parseFileUrl: url => url === `/api/files/${filename}` ? filename : null },
      'lib/image-storage': { imageStorageDirectory: () => 'H:/test-files' },
      'node:fs/promises': { readFile: async () => { reads++; return Buffer.from('pdf'); } },
    });
    const response = await route.GET(new Request('https://example.test'), { params: Promise.resolve({ filename }) });
    assert.equal(response.status, status);
    if (status === 200) assert.match(response.headers.get('Cache-Control'), visibility === 'PUBLIC' ? /^public/ : /^private/);
  }
  assert.equal(reads, 3);
});
