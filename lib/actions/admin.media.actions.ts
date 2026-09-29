"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionResult, ExpectedError } from "@/lib/action-result";
import { requireAdmin } from "@/lib/access";
import { writeAudit } from "@/lib/audit";
import prisma from "@/lib/db";
import { imageStorageDirectory } from "@/lib/image-storage";
import { mediaMetadataSchema, mediaUrl } from "@/lib/media";

const filenameSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/);

export async function listMediaForPicker(q = "", page = 1) {
  await requireAdmin();
  const search = z.string().trim().max(100).parse(q);
  const safePage = z.number().int().min(1).max(1000).parse(page);
  const where = search ? { OR: [
    { title: { contains: search, mode: "insensitive" as const } },
    { altText: { contains: search, mode: "insensitive" as const } },
    { description: { contains: search, mode: "insensitive" as const } },
  ] } : {};
  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({ where, select: { filename: true, title: true, altText: true, width: true, height: true }, orderBy: { createdAt: "desc" }, take: 18, skip: (safePage - 1) * 18 }),
    prisma.mediaAsset.count({ where }),
  ]);
  return { assets: assets.map(asset => ({ ...asset, url: mediaUrl(asset.filename) })), total };
}

export async function saveMediaMetadata(filename: string, input: unknown) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    const safeFilename = filenameSchema.parse(filename);
    const metadata = mediaMetadataSchema.parse(input);
    const saved = await prisma.$transaction(async tx => {
      const asset = await tx.mediaAsset.update({ where: { filename: safeFilename }, data: metadata });
      await writeAudit(tx, actor.id, "MEDIA_METADATA_UPDATED", "MediaAsset", safeFilename);
      return asset;
    });
    revalidatePath("/admin/media");
    return { success: true as const, filename: saved.filename };
  });
}

export async function deleteMedia(filename: string) {
  return actionResult(async () => {
    const actor = await requireAdmin();
    const safeFilename = filenameSchema.parse(filename);
    const url = mediaUrl(safeFilename);
    const removed = await prisma.$transaction(async tx => {
      const assets = await tx.$queryRaw<{ filename: string }[]>`SELECT "filename" FROM "MediaAsset" WHERE "filename" = ${safeFilename} FOR UPDATE`;
      if (!assets.length) throw new ExpectedError("تصویر پیدا نشد.");
      const references = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "BlogPost"
        WHERE "coverImage" = ${url} OR "ogImage" = ${url} OR "content"::text LIKE ${`%${safeFilename}%`}
        LIMIT 1`;
      if (references.length) throw new ExpectedError("این تصویر در یک مقاله استفاده شده است. ابتدا آن را از مقاله حذف کنید.");
      const asset = await tx.mediaAsset.delete({ where: { filename: safeFilename } });
      await writeAudit(tx, actor.id, "MEDIA_DELETED", "MediaAsset", safeFilename);
      return asset;
    });
    try {
      await unlink(path.join(imageStorageDirectory(), removed.filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("Unable to remove media file", error);
    }
    revalidatePath("/admin/media");
    return { success: true as const };
  });
}

