import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { imageStorageDirectory } from "@/lib/image-storage";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!/^[0-9a-f-]{36}\.webp$/.test(filename)) return new NextResponse(null, { status: 404 });
  const asset = await prisma.blogImageAsset.findUnique({ where: { filename }, select: { filename: true } });
  if (!asset) return new NextResponse(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(imageStorageDirectory(), filename));
    return new NextResponse(bytes, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=3600, s-maxage=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
