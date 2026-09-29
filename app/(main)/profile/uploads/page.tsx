import { requireUser } from "@/lib/access";
import prisma from "@/lib/db";
import { FileUploadForm } from "@/components/media/FileUploadForm";
import UploadList from "./UploadList";
export default async function UploadsPage() {
  const user = await requireUser();
  const assets = await prisma.imageAsset.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <main className="space-y-6"><div><h1 className="text-2xl font-bold">فایل‌های من</h1><p className="text-sm text-muted-foreground">فایل‌های خصوصی شما فقط برای شما و مدیران قابل مشاهده‌اند.</p></div><FileUploadForm /><UploadList assets={assets.map(asset => ({ filename: asset.filename, size: asset.size, originalName: asset.originalName, mimeType: asset.mimeType, visibility: asset.visibility }))} /></main>;
}
