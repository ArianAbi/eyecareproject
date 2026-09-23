# Image uploads

`ImageInput` uploads on selection and returns a table-independent `StoredImage` through `onChange`.
Uploads require a signed-in user. Image URLs are public; do not use this storage for private patient records or identity documents.

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

Save `image.url` and `image.base64` in your chosen table's string columns; width and height are useful optional columns. The component does not modify your database. With React Hook Form, use a `Controller` and pass `value={field.value}`, `onChange={field.onChange}`, and `onBlur={field.onBlur}`. Disable form submission while uploading via `onUploadingChange`.

For Next Image: `<Image src={image.url} width={image.width} height={image.height} alt="Product" placeholder="blur" blurDataURL={image.base64} />`.

The standalone `uploadImageAction` accepts FormData with an `image` File and returns `{ success: true, data: StoredImage }` or `{ success: false, error: string }`.

## Processing and storage

- The client and server enforce 5 MiB (5 × 1024 × 1024 bytes) before compression. Next's request limit is 6 MiB to allow multipart overhead; restart the development server after changing the config.
- Sharp verifies decoded content, accepts still JPEG/PNG/WebP, caps decoded input at 40 megapixels, auto-orients, strips metadata, and outputs WebP at quality 80 with a maximum 2048-pixel edge. Small images are not enlarged. Lossy compression can alter fine details and is not intended for diagnostic originals. Re-encoding is not guaranteed to shrink every already optimized input.
- The placeholder is exactly 10 × 10 WebP pixels, returned as a complete `data:image/webp;base64,...` URL. Base64 adds approximately 33% to binary size, which is fine for this tiny placeholder; avoid storing the full image as base64. The placeholder is only for a blurred preview, not a usable thumbnail.
- Files default to `storage/uploads`. Set `IMAGE_UPLOAD_DIR` to an absolute persistent directory in production. Use the Node.js runtime. Back up this directory alongside your database; multiple app instances need shared storage. Ephemeral/serverless disks require a different storage backend such as object storage. Proxy and hosting request limits must also permit the payload.
- The remove button clears the form value only. It does not delete files, since another table might reference them. Replacements and abandoned forms can leave unused uploads; add reference-aware cleanup when integrating your tables. Add deployment-appropriate upload quotas/rate limits if needed; authentication alone does not limit a user's disk consumption.
- Filenames are generated UUIDs. Callers cannot choose server paths. The serving route accepts only those filenames and returns immutable WebP content.

The Attachment composition follows [shadcn's Base UI documentation](https://ui.shadcn.com/docs/components/base/attachment) and uses this project's Base UI Button.
