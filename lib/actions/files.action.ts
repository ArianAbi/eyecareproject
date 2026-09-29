"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/Auth";
import { writeAudit } from "@/lib/audit";
import prisma from "@/lib/db";
import { MAX_FILE_BYTES, parseFileUrl, resolveUploadVisibility, storeUserFile } from "@/lib/file-upload";
import { imageStorageDirectory, InvalidImageError } from "@/lib/image-storage";
import { allowOperation } from "@/lib/rate-limit";

export async function uploadFileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "برای بارگذاری فایل ابتدا وارد شوید." };
  try {
    const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
    if (!account) return { success: false as const, error: "حساب کاربری پیدا نشد." };
    const visibility = resolveUploadVisibility(formData.get("visibility"), account.admin);
    if (!await allowOperation("file-upload", session.user.id, 10, 3600000)) return { success: false as const, error: "محدودیت بارگذاری پر شده است. بعداً تلاش کنید." };
    if (process.env.NODE_ENV === "production" && !process.env.IMAGE_UPLOAD_DIR) return { success: false as const, error: "فضای ذخیره‌سازی پایدار تنظیم نشده است." };
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) return { success: false as const, error: "فایل PDF یا تصویر کمتر از ۵ مگابایت انتخاب کنید." };
    let filename: string | undefined;
    try {
      const stored = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${session.user.id} FOR UPDATE`;
        const usage = await tx.imageAsset.aggregate({ where: { ownerId: session.user.id }, _sum: { size: true }, _count: true });
        if (usage._count >= 100 || (usage._sum.size ?? 0) + MAX_FILE_BYTES > 100 * 1024 * 1024) throw new InvalidImageError("سهمیه فایل‌های حساب کاربری پر شده است.");
        const upload = await storeUserFile(file);
        filename = upload.filename;
        await tx.imageAsset.create({ data: { filename, ownerId: session.user.id!, size: upload.size, mimeType: upload.mimeType, originalName: upload.originalName, visibility } });
        await writeAudit(tx, session.user.id!, "FILE_UPLOADED", "ImageAsset", filename, visibility);
        return upload;
      }, { timeout: 20000 });
      revalidatePath("/profile/uploads"); revalidatePath("/admin/media");
      return { success: true as const, data: { url: stored.url, filename: stored.filename, size: stored.size, mimeType: stored.mimeType, visibility, base64: stored.base64, width: stored.width, height: stored.height } };
    } catch (error) {
      if (filename) await unlink(path.join(imageStorageDirectory(), filename)).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof InvalidImageError) return { success: false as const, error: "فایل نامعتبر است، حجم آن زیاد است یا سهمیه بارگذاری شما پر شده است." };
    console.error("File upload failed", error);
    return { success: false as const, error: "بارگذاری فایل انجام نشد. دوباره تلاش کنید." };
  }
}

export async function deleteFileAction(url: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "ابتدا وارد شوید." };
  const filename = parseFileUrl(url);
  if (!filename) return { success: false as const, error: "نشانی فایل معتبر نیست." };
  const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!account) return { success: false as const, error: "حساب کاربری پیدا نشد." };
  const asset = await prisma.imageAsset.findFirst({ where: { filename, ...(account.admin ? {} : { ownerId: session.user.id }) } });
  if (!asset) return { success: false as const, error: "فایل پیدا نشد یا دسترسی ندارید." };
  try {
    await prisma.$transaction(async tx => {
      await tx.imageAsset.delete({ where: { filename } });
      await writeAudit(tx, session.user.id!, "FILE_DELETED", "ImageAsset", filename);
    });
    await unlink(path.join(imageStorageDirectory(), filename)).catch(error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("File removal failed", error); });
    revalidatePath("/profile/uploads"); revalidatePath("/admin/media");
    return { success: true as const };
  } catch (error) {
    console.error("File deletion failed", error);
    return { success: false as const, error: "حذف فایل انجام نشد." };
  }
}
