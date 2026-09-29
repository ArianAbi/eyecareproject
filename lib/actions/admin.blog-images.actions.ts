"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/access";
import prisma from "@/lib/db";
import { imageStorageDirectory, InvalidImageError, storeImage } from "@/lib/image-storage";
import { MAX_IMAGE_BYTES } from "@/lib/image-upload";
import { allowOperation } from "@/lib/rate-limit";

export async function uploadBlogImage(formData: FormData) {
  try {
    const actor = await requireAdmin();
    if (!await allowOperation("blog-upload", actor.id, 20, 3600000)) return { success: false as const, error: "Upload limit reached. Try later." };
    if (process.env.NODE_ENV === "production" && !process.env.IMAGE_UPLOAD_DIR) return { success: false as const, error: "Persistent image storage is not configured." };
    const file = formData.get("image");
    if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE_BYTES) return { success: false as const, error: "Choose a JPEG, PNG or WebP image under 5 MB." };
    let filename: string | undefined;
    try {
      const stored = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${actor.id} FOR UPDATE`;
        const usage = await tx.blogImageAsset.aggregate({ where: { ownerId: actor.id }, _sum: { size: true }, _count: true });
        if (usage._count >= 300 || (usage._sum.size ?? 0) + MAX_IMAGE_BYTES > 300 * 1024 * 1024) throw new InvalidImageError("Blog image quota reached.");
        const image = await storeImage(Buffer.from(await file.arrayBuffer()));
        filename = image.url.split("/").pop()!;
        await tx.blogImageAsset.create({ data: { filename, ownerId: actor.id, size: image.size } });
        return image;
      }, { timeout: 20000 });
      return { success: true as const, url: `/api/blog/images/${filename}`, width: stored.width, height: stored.height };
    } catch (error) {
      if (filename) await unlink(path.join(imageStorageDirectory(), filename)).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof InvalidImageError) return { success: false as const, error: error.message };
    console.error("Blog image upload failed", error);
    return { success: false as const, error: "Unable to upload image." };
  }
}
