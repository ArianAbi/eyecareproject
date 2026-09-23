import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, type StoredImage } from "./image-upload";

export function imageStorageDirectory() {
  return path.resolve(process.env.IMAGE_UPLOAD_DIR || path.join(process.cwd(), "storage/uploads"));
}

export class InvalidImageError extends Error {}

export async function compressImage(input: Buffer) {
  if (!input.length || input.length > MAX_IMAGE_BYTES) {
    throw new InvalidImageError("Choose an image no larger than 5 MB.");
  }
  try {
    const source = sharp(input, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await source.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new InvalidImageError("Only JPEG, PNG and WebP images are supported.");
    }
    if ((metadata.pages ?? 1) > 1) {
      throw new InvalidImageError("Please choose a still image, not an animated image.");
    }
    // Auto-orient before resizing; re-encoding strips EXIF/GPS and other metadata.
    const { data, info } = await source.rotate()
      .resize({ width: 2048, height: 2048, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    if (data.length > MAX_IMAGE_BYTES) {
      throw new InvalidImageError("The processed image is too large. Choose a smaller image.");
    }
    const placeholder = await sharp(data).resize(10, 10, { fit: "fill" })
      .webp({ quality: 30 }).toBuffer();
    return { data, width: info.width, height: info.height,
      base64: `data:image/webp;base64,${placeholder.toString("base64")}` };
  } catch (error) {
    if (error instanceof InvalidImageError) throw error;
    throw new InvalidImageError("This image is damaged, unsupported, or exceeds 40 megapixels.");
  }
}

export async function storeImage(input: Buffer): Promise<StoredImage> {
  const image = await compressImage(input);
  const filename = `${randomUUID()}.webp`;
  const directory = imageStorageDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), image.data, { flag: "wx" });
  return { url: `/api/images/${filename}`, base64: image.base64,
    width: image.width, height: image.height, size: image.data.length };
}
