import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/Auth";
import prisma from "@/lib/db";
import { parseFileUrl } from "@/lib/file-upload";
import { imageStorageDirectory } from "@/lib/image-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  if (!parseFileUrl(`/api/files/${filename}`)) return new Response(null, { status: 404 });
  const asset = await prisma.imageAsset.findUnique({ where: { filename }, select: { filename: true, ownerId: true, visibility: true } });
  if (!asset) return new Response(null, { status: 404 });
  if (asset.visibility !== "PUBLIC") {
    const session = await auth();
    if (!session?.user?.id) return new Response(null, { status: 401 });
    if (session.user.id !== asset.ownerId) {
      const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
      if (!admin?.admin) return new Response(null, { status: 404 });
    }
  }
  try {
    const bytes = await readFile(path.join(imageStorageDirectory(), filename));
    const pdf = filename.endsWith(".pdf");
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": pdf ? "application/pdf" : "image/webp",
      "Content-Length": String(bytes.length),
      "Content-Disposition": pdf ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`,
      "Cache-Control": asset.visibility === "PUBLIC" ? "public, max-age=3600, s-maxage=86400" : "private, no-store",
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    console.error("File read failed", error);
    return new Response(null, { status: 500 });
  }
}
