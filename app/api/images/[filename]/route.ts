import { auth } from "@/lib/Auth";
import prisma from "@/lib/db";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { imageStorageDirectory } from "@/lib/image-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/.test(filename)) {
    return new Response(null, { status: 404 });
  }
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });
  const account = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  const asset = await prisma.imageAsset.findFirst({ where: { filename, ...(account?.admin ? {} : { ownerId: session.user.id }) } });
  if (!asset) return new Response(null, { status: 404 });
  try {
    const data = await readFile(path.join(imageStorageDirectory(), filename));
    return new Response(new Uint8Array(data), { headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response(null, { status: 404 });
    console.error("Image read failed", error);
    return new Response(null, { status: 500 });
  }
}
