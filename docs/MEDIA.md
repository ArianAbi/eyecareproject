# Public media library

The admin page `/admin/media` lists public images uploaded for articles and future site content. It supports search, pagination, copyable URLs, metadata edits, uploads, and deletion. The **User files** tab at `/admin/media/users` shows files owned by users and admins, including their visibility and owner. It also lets an admin upload an image or PDF as private or public. Customer uploads default to private and cannot be marked public by the customer.

`MediaAsset` is the canonical record for public images. Migration `20260930120000_media_library` renames the former `BlogImageAsset` table and adds metadata, preserving existing files, owner IDs, and `/api/blog/images/[filename]` URLs. Existing images may have empty metadata until an admin edits them. The migration was applied to the configured local database on 2026-09-29; deploy it to other environments before using the page. `IMAGE_UPLOAD_DIR` must still be durable and shared in production.

The reusable client component `components/media/MediaPickerDialog.tsx` supports selecting an existing asset or uploading a new one. `onSelect` receives `{ filename, url, title, altText, width, height }`. It is wired into the blog body, cover, and social image controls. Future models can add an optional `mediaFilename` foreign key to `MediaAsset.filename`; render using `/api/blog/images/${filename}` and the asset's `altText`. Do not store the tiny blur data URL as a full-size image. The public image route remains the same for URL stability.

Upload accepts a still JPEG/PNG/WebP of at most 5 MiB; Sharp strips source metadata, resizes and converts to WebP. Media title and alt text are required for new uploads; description and up to 12 keywords are optional. These fields are authoring data, not a guarantee of search ranking or AI citation. The blog cover uses media metadata in visible alt text and `ImageObject` structured data. Other consumers must likewise render relevant metadata visibly or in appropriate structured data; merely storing keywords in the database has no SEO effect.

Admin actions recheck `requireAdmin`, validate metadata and filenames, and audit changes. Deletion refuses images referenced by any blog cover, social image, or Tiptap body. External uses of a copied URL cannot be detected, so the confirmation warns that deletion can break them. Future model relations should use `onDelete: Restrict` and be checked before removing an asset. Media remains subject to the existing per-owner quota (300 images/300 MiB) and rate limit (20 uploads/hour). File removal happens after the database delete; if removal fails, an orphan file may remain and is logged for cleanup.

The dry-run-first `scripts/cleanup-orphan-images.cjs` checks both `ImageAsset` and `MediaAsset`, so it will not mistake public media for orphaned files.

## User files, visibility, and endpoints

Migration `20260930130000_file_visibility` adds `ImageAsset.visibility`, `mimeType`, and `originalName`. Existing `ImageAsset` rows remain `PRIVATE` WebP images; deploy both media migrations before using these pages. User files and public blog images share the configured durable `IMAGE_UPLOAD_DIR`, but remain distinct database records and routes.

| Entry point | Purpose | Access |
| --- | --- | --- |
| `uploadFileAction(FormData)` in `lib/actions/files.action.ts` | Generic image/PDF upload; `file` is required, `visibility` may be `PRIVATE` or `PUBLIC` | Signed-in user; only an admin may request `PUBLIC` |
| `GET /api/files/[filename]` | Serve a generic file by the returned URL | Anyone for `PUBLIC`; owner or current admin for `PRIVATE` |
| `deleteFileAction(url)` | Delete generic file record and disk file | Owner or admin |
| `uploadImageAction(FormData)` in `lib/actions/images.action.ts` | Existing image-only upload for `ImageInput`; returns a private `/api/images/...` URL and blur placeholder | Signed-in user |
| `GET /api/images/[filename]` | Serve legacy/private `ImageInput` images | Owner or current admin |
| `uploadBlogImage` in `lib/actions/admin.blog-images.actions.ts` | Admin public-image upload with title, alt text, description and keywords | Admin |
| `GET /api/blog/images/[filename]` | Serve public `MediaAsset` images | Anyone |

The generic action validates the account's current database role, limits uploads to 10/hour and 100 assets/100 MiB per owner, verifies file bytes, and accepts still JPEG/PNG/WebP or PDF up to 5 MiB. Images are re-encoded as WebP; PDFs retain their bytes and are served as downloads with `nosniff` and a sandbox CSP. New files have UUID names. The returned `data.url` is the canonical link; `data.base64` is only a tiny image blur placeholder and is `null` for PDFs. Do not persist it as the file itself. The generic action's visibility decision happens server-side; a client checkbox is not authorization. Private responses use `Cache-Control: private, no-store`. Public files are cacheable.

The customer page `/profile/uploads` uses the generic action and lists the owner's files. Admin `/admin/media/users` searches filenames and usernames and can open private files through the authenticated route. Neither page exposes the raw storage directory. For later Product or other model attachments, store a foreign key to `ImageAsset.filename` (for generic files) or `MediaAsset.filename` (for SEO-authored public images), add the appropriate Prisma relation, and decide retention/deletion behavior explicitly. A public product image is best selected through `MediaPickerDialog` and `MediaAsset`; do not embed a private `/api/files/...` URL in a public page.
