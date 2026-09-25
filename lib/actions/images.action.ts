"use server";

import prisma from "../db";
import { allowOperation } from "../rate-limit";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { imageStorageDirectory } from "../image-storage";
import { auth } from "@/lib/Auth";
import { MAX_IMAGE_BYTES, type ImageUploadResult } from "@/lib/image-upload";
import { InvalidImageError, storeImage } from "@/lib/image-storage";

export async function uploadImageAction(formData: FormData): Promise<ImageUploadResult> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Sign in to upload an image." };
        if (!await allowOperation("upload", session.user.id, 10, 3600000)) return { success: false, error: "Upload limit reached. Try later." };
        if (process.env.NODE_ENV === "production" && !process.env.IMAGE_UPLOAD_DIR) return { success: false, error: "Persistent upload storage is not configured." };
        const file = formData.get("image");
        if (!(file instanceof File) || file.size === 0) {
            return { success: false, error: "Choose an image to upload." };
        }
        if (file.size > MAX_IMAGE_BYTES) {
            return { success: false, error: "Choose an image no larger than 5 MB." };
        }
        let stored: Awaited<ReturnType<typeof storeImage>> | undefined;
        try {
            const data = await prisma.$transaction(async tx => {
                await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`;
                const usage = await tx.imageAsset.aggregate({ where: { ownerId: session.user.id }, _sum: { size: true }, _count: true });
                if (usage._count >= 100 || (usage._sum.size ?? 0) + MAX_IMAGE_BYTES > 100 * 1024 * 1024) throw new InvalidImageError("Image storage quota reached. Remove unused images.");
                stored = await storeImage(Buffer.from(await file.arrayBuffer()));
                await tx.imageAsset.create({ data: { filename: stored.url.split("/").pop()!, ownerId: session.user.id!, size: stored.size } });
                return stored;
            }, { timeout: 20000 });
            return { success: true, data };
        } catch (error) {
            if (stored) await unlink(path.join(imageStorageDirectory(), stored.url.split("/").pop()!)).catch(() => { });
            throw error;
        }
    } catch (error) {
        if (error instanceof InvalidImageError) return { success: false, error: error.message };
        console.error("Image upload failed", error);
        return { success: false, error: "Unable to store the image. Please try again." };
    }
}

export async function deleteImageAction(url: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };
    const filename = url.replace(/^\/api\/images\//, "");
    if (!/^[0-9a-f-]{36}\.webp$/.test(filename)) return { success: false };
    const owner = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
    const asset = await prisma.imageAsset.findFirst({ where: { filename, ...(owner?.admin ? {} : { ownerId: session.user.id }) } });
    if (!asset) return { success: false };
    try {
        await unlink(path.join(imageStorageDirectory(), filename)).catch(error => { if (error.code !== "ENOENT") throw error; });
        await prisma.imageAsset.deleteMany({ where: { filename, ownerId: asset.ownerId } });
        return { success: true };
    } catch { return { success: false }; }
}
