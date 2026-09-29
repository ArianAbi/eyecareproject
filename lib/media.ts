import { z } from "zod";

export const mediaMetadataSchema = z.object({
  title: z.string().trim().min(2).max(160),
  altText: z.string().trim().min(2).max(200),
  description: z.string().trim().max(500),
  keywords: z.array(z.string().trim().min(2).max(60)).max(12),
});

export type MediaMetadata = z.infer<typeof mediaMetadataSchema>;

export function parseMediaKeywords(value: string) {
  return [...new Set(value.split(/[,،\n]/).map(word => word.trim()).filter(Boolean))];
}

export const mediaUrl = (filename: string) => `/api/blog/images/${filename}`;

export function mediaFilename(url: string) {
  if (!url.startsWith("/api/blog/images/")) return null;
  const filename = url.slice("/api/blog/images/".length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/.test(filename) ? filename : null;
}
