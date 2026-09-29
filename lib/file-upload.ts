import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageStorageDirectory, InvalidImageError, storeImage } from "@/lib/image-storage";
import { MAX_IMAGE_BYTES } from "@/lib/image-upload";

export const MAX_FILE_BYTES = MAX_IMAGE_BYTES;
export const FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
export type UploadVisibility = "PRIVATE" | "PUBLIC";

export function resolveUploadVisibility(requested: unknown, isAdmin: boolean): UploadVisibility {
  if (requested === undefined || requested === null || requested === "PRIVATE") return "PRIVATE";
  if (requested === "PUBLIC" && isAdmin) return "PUBLIC";
  throw new InvalidImageError("انتشار عمومی فایل فقط برای مدیر مجاز است.");
}

export function isPdf(bytes: Buffer) {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-" && bytes.subarray(-1024).includes(Buffer.from("%%EOF"));
}

export function isSupportedImage(bytes: Buffer) {
  return (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP");
}

export async function storeUserFile(file: File) {
  if (!file.size || file.size > MAX_FILE_BYTES) throw new InvalidImageError("فایل باید کمتر از ۵ مگابایت باشد.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const originalName = file.name.replace(/[\\/\x00-\x1f\x7f]/g, "_").slice(0, 180);
  if (isPdf(bytes)) {
    const filename = `${randomUUID()}.pdf`;
    const directory = imageStorageDirectory();
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });
    return { filename, url: `/api/files/${filename}`, size: bytes.length, mimeType: "application/pdf", originalName, base64: null, width: null, height: null };
  }
  if (!isSupportedImage(bytes)) throw new InvalidImageError("فقط تصویر JPEG، PNG، WebP یا فایل PDF معتبر پذیرفته می‌شود.");
  const stored = await storeImage(bytes);
  const filename = stored.url.split("/").pop()!;
  return { filename, url: `/api/files/${filename}`, size: stored.size, mimeType: "image/webp", originalName, base64: stored.base64, width: stored.width, height: stored.height };
}

export function parseFileUrl(url: string) {
  if (!url.startsWith("/api/files/")) return null;
  const filename = url.slice("/api/files/".length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webp|pdf)$/.test(filename) ? filename : null;
}
