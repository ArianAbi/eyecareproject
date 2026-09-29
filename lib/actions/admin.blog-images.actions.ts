"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import { imageStorageDirectory, InvalidImageError, storeImage } from "@/lib/image-storage";
import { MAX_IMAGE_BYTES } from "@/lib/image-upload";
import { allowOperation } from "@/lib/rate-limit";
import { mediaMetadataSchema, mediaUrl, parseMediaKeywords } from "@/lib/media";
import { writeAudit } from "@/lib/audit";

export async function uploadBlogImage(formData: FormData) {
  try {
    const actor = await requireAdmin();
    if (!await allowOperation("blog-upload", actor.id, 20, 3600000)) return { success: false as const, error: "محدودیت بارگذاری پر شده است. بعداً دوباره تلاش کنید." };
    if (process.env.NODE_ENV === "production" && !process.env.IMAGE_UPLOAD_DIR) return { success: false as const, error: "فضای ذخیره‌سازی پایدار تصویر تنظیم نشده است." };
    const file = formData.get("image");
    if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE_BYTES) return { success: false as const, error: "یک تصویر JPEG، PNG یا WebP کوچک‌تر از ۵ مگابایت انتخاب کنید." };
    const title = formData.get("title");
    const metadata = title === null ? { title: "", altText: "", description: "", keywords: [] as string[] } : mediaMetadataSchema.safeParse({
      title, altText: formData.get("altText"), description: formData.get("description") ?? "",
      keywords: parseMediaKeywords(String(formData.get("keywords") ?? "")),
    }).data;
    if (!metadata) return { success: false as const, error: "عنوان، متن جایگزین یا برچسب‌های تصویر معتبر نیستند." };
    let filename: string | undefined;
    try {
      const stored = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${actor.id} FOR UPDATE`;
        const usage = await tx.mediaAsset.aggregate({ where: { ownerId: actor.id }, _sum: { size: true }, _count: true });
        if (usage._count >= 300 || (usage._sum.size ?? 0) + MAX_IMAGE_BYTES > 300 * 1024 * 1024) throw new InvalidImageError("سهمیه فضای رسانه پر شده است.");
        const image = await storeImage(Buffer.from(await file.arrayBuffer()));
        filename = image.url.split("/").pop()!;
        await tx.mediaAsset.create({ data: { filename, ownerId: actor.id, size: image.size, width: image.width, height: image.height, blurDataUrl: image.base64, ...metadata } });
        await writeAudit(tx, actor.id, "MEDIA_UPLOADED", "MediaAsset", filename);
        return image;
      }, { timeout: 20000 });
      return { success: true as const, url: mediaUrl(filename!), width: stored.width, height: stored.height, base64: stored.base64 };
    } catch (error) {
      if (filename) await unlink(path.join(imageStorageDirectory(), filename)).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof InvalidImageError) return { success: false as const, error: error.message.startsWith("سهمیه") ? error.message : "تصویر معتبر نیست، بیش از حد بزرگ است یا قالب آن پشتیبانی نمی‌شود." };
    console.error("Blog image upload failed", error);
    return { success: false as const, error: "بارگذاری تصویر انجام نشد. دوباره تلاش کنید." };
  }
}
