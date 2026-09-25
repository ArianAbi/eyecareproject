# Image uploads

`ImageInput` uploads on selection and returns a table-independent `StoredImage` through `onChange`.
Uploads require a signed-in user. Image URLs require the owner or a current admin session. ImageAsset records owner, filename, size and creation time. These are compressed application assets, not diagnostic originals.

```tsx
"use client";

import { useState } from "react";
import { ImageInput } from "@/components/core/ImageInput";
import type { StoredImage } from "@/lib/image-upload";

export function ProductImageField() {
  const [image, setImage] = useState<StoredImage | null>(null);
  const [uploading, setUploading] = useState(false);
  return <>
    <ImageInput value={image} onChange={setImage} onUploadingChange={setUploading} />
    <button type="submit" disabled={uploading}>Save</button>
  </>;
}
```

Save `image.url` and `image.base64` in your chosen table's string columns; width and height are useful optional columns. The upload action creates an ImageAsset ownership record; the component does not attach the image to a business entity. No current Product image-reference field exists. Add explicit reference/retention rules before sharing a file across records. With React Hook Form, use a `Controller` and pass `value={field.value}`, `onChange={field.onChange}`, and `onBlur={field.onBlur}`. Disable form submission while uploading via `onUploadingChange`.

For Next Image, bypass the image optimizer so the browser sends its session cookie to the private route: `<Image unoptimized src={image.url} width={image.width} height={image.height} alt="Product" placeholder="blur" blurDataURL={image.base64} />`.

The standalone `uploadImageAction` accepts FormData with an `image` File and returns `{ success: true, data: StoredImage }` or `{ success: false, error: string }`.

## Processing and storage

- The client and server enforce 5 MiB (5 × 1024 × 1024 bytes) before compression. Next's request limit is 6 MiB to allow multipart overhead; restart the development server after changing the config.
- Sharp verifies decoded content, accepts still JPEG/PNG/WebP, caps decoded input at 40 megapixels, auto-orients, strips metadata, and outputs WebP at quality 80 with a maximum 2048-pixel edge. Small images are not enlarged. Lossy compression can alter fine details and is not intended for diagnostic originals. Re-encoding is not guaranteed to shrink every already optimized input.
- The placeholder is exactly 10 × 10 WebP pixels, returned as a complete `data:image/webp;base64,...` URL. Base64 adds approximately 33% to binary size, which is fine for this tiny placeholder; avoid storing the full image as base64. The placeholder is only for a blurred preview, not a usable thumbnail.
- Development files default to `storage/uploads`. Production uploads fail closed unless `IMAGE_UPLOAD_DIR` is configured; set it to an absolute persistent directory. Use the Node.js runtime. Back up this directory alongside your database; multiple app instances need shared storage. Ephemeral/serverless disks require a different storage backend such as object storage. Proxy and hosting request limits must also permit the payload.
- Removal and replacement call an authenticated deletion action. Only an owner/admin can delete the file and metadata. On replacement failure the original value remains. Abandoned forms remain visible in `/profile/uploads`, where the owner can remove unused assets.
- Quota: at most 100 assets and 100 MiB per account; upload reserves worst-case 5 MiB headroom under a database user-row lock before writing. Rate limit: 10 uploads per account/hour. Failed transactions attempt to remove the newly written file.
- Filenames are generated UUIDs. Callers cannot choose paths. GET enforces ownership before disk access and returns `Cache-Control: private, no-store`.
- Migration does not guess ownership of old files. Legacy files without ImageAsset metadata are inaccessible until an operator explicitly maps them to an owner. Review that mapping before orphan cleanup.
- `node scripts/cleanup-orphan-images.cjs` is a dry run for untracked UUID WebP files older than 24 hours (up to 1000 per run). An operator can use `--apply` after reviewing the output and configured persistent directory. Metadata-backed assets are preserved. Never use this as a substitute for future business-reference retention policies.

See [deployment notes](hardening-deployment.md) for migration, proxy and storage requirements. Private HTTP access does not itself establish medical-record retention/compliance.


The Attachment composition follows [shadcn's Base UI documentation](https://ui.shadcn.com/docs/components/base/attachment) and uses this project's Base UI Button.
