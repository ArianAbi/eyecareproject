import { z } from "zod";

export type BlogMark = { type: "bold" | "italic" | "underline" | "strike" | "code" | "link"; attrs?: { href?: string } };
export type BlogNode = { type: string; text?: string; attrs?: Record<string, unknown>; marks?: BlogMark[]; content?: BlogNode[] };

const nodeTypes = new Set(["doc", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "horizontalRule", "hardBreak", "image", "table", "tableRow", "tableCell", "tableHeader", "codeBlock"]);
const markTypes = new Set(["bold", "italic", "underline", "strike", "code", "link"]);
const localImage = /^\/api\/blog\/images\/[0-9a-f-]{36}\.webp$/;

export function safeBlogLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? value : null;
  } catch { return null; }
}

export function isBlogImage(value: unknown): value is string {
  return typeof value === "string" && localImage.test(value);
}

export function normalizeBlogContent(value: unknown): BlogNode {
  if (JSON.stringify(value)?.length > 200_000) throw new Error("Article content is too long.");
  let count = 0;
  function visit(input: unknown, depth: number): BlogNode {
    if (++count > 5000 || depth > 30 || !input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid article content.");
    const node = input as Record<string, unknown>;
    if (node.type === "text") {
      if (typeof node.text !== "string" || node.text.length > 20_000) throw new Error("Invalid article text.");
      const marks = Array.isArray(node.marks) ? node.marks.map((mark): BlogMark => {
        if (!mark || typeof mark !== "object" || !markTypes.has(mark.type)) throw new Error("Invalid text formatting.");
        if (mark.type === "link") {
          const href = safeBlogLink(mark.attrs?.href);
          if (!href) throw new Error("Invalid link URL.");
          return { type: "link", attrs: { href } };
        }
        return { type: mark.type };
      }) : undefined;
      return { type: "text", text: node.text, ...(marks?.length ? { marks } : {}) };
    }
    if (typeof node.type !== "string" || !nodeTypes.has(node.type)) throw new Error("Unsupported article block.");
    const result: BlogNode = { type: node.type };
    if (node.type === "heading") {
      const level = (node.attrs as Record<string, unknown> | undefined)?.level;
      if (![2, 3, 4].includes(Number(level))) throw new Error("Use H2 to H4 headings in the article.");
      result.attrs = { level: Number(level) };
    }
    if (node.type === "image") {
      const attrs = node.attrs as Record<string, unknown> | undefined;
      if (!isBlogImage(attrs?.src) || typeof attrs?.alt !== "string" || !attrs.alt.trim() || attrs.alt.length > 200) throw new Error("Images need a public blog upload and descriptive alt text.");
      result.attrs = { src: attrs.src, alt: attrs.alt.trim(), title: typeof attrs.title === "string" ? attrs.title.slice(0, 200) : "" };
    }
    if (["tableCell", "tableHeader"].includes(node.type)) {
      const attrs = node.attrs as Record<string, unknown> | undefined;
      const colspan = Math.min(10, Math.max(1, Number(attrs?.colspan) || 1));
      const rowspan = Math.min(10, Math.max(1, Number(attrs?.rowspan) || 1));
      result.attrs = { colspan, rowspan };
    }
    if (["paragraph", "heading"].includes(node.type)) {
      const align = (node.attrs as Record<string, unknown> | undefined)?.textAlign;
      if (["left", "right", "center", "justify"].includes(String(align))) result.attrs = { ...result.attrs, textAlign: align };
    }
    if (Array.isArray(node.content)) result.content = node.content.map(child => visit(child, depth + 1));
    return result;
  }
  const parsed = visit(value, 0);
  if (parsed.type !== "doc") throw new Error("Article content must be a document.");
  return parsed;
}

export const faqSchema = z.array(z.object({ question: z.string().trim().min(8).max(200), answer: z.string().trim().min(12).max(1500) })).max(20);

export const blogPostSchema = z.object({
  title: z.string().trim().min(5).max(180),
  slug: z.string().trim().min(2).max(180).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "Use letters, numbers and hyphens in the URL slug."),
  excerpt: z.string().trim().max(500),
  content: z.unknown().transform((value, ctx) => {
    try { return normalizeBlogContent(value); }
    catch (error) {
      ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid article content." });
      return z.NEVER;
    }
  }),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  publishedAt: z.string().nullable(),
  featured: z.boolean(),
  coverImage: z.union([z.string(), z.literal("")]).nullable(),
  coverAlt: z.string().trim().max(200),
  seoTitle: z.string().trim().max(100),
  metaDescription: z.string().trim().max(320),
  canonicalUrl: z.string().trim().max(2048),
  ogTitle: z.string().trim().max(100),
  ogDescription: z.string().trim().max(320),
  ogImage: z.string().trim().max(2048),
  noindex: z.boolean(),
  faq: faqSchema,
  categoryId: z.string().uuid().nullable(),
  tagIds: z.array(z.string().uuid()).max(20),
}).superRefine((data, ctx) => {
  if (data.coverImage && !isBlogImage(data.coverImage)) ctx.addIssue({ code: "custom", path: ["coverImage"], message: "Choose a blog image upload." });
  if (data.coverImage && !data.coverAlt) ctx.addIssue({ code: "custom", path: ["coverAlt"], message: "Cover image alt text is required." });
  if (data.ogImage && !isBlogImage(data.ogImage)) ctx.addIssue({ code: "custom", path: ["ogImage"], message: "Choose a blog image upload." });
  if (data.canonicalUrl && (!safeBlogLink(data.canonicalUrl) || !data.canonicalUrl.startsWith("https://"))) ctx.addIssue({ code: "custom", path: ["canonicalUrl"], message: "Use an HTTPS canonical URL." });
  if (data.status === "SCHEDULED" && (!data.publishedAt || Number.isNaN(Date.parse(data.publishedAt)) || Date.parse(data.publishedAt) <= Date.now())) ctx.addIssue({ code: "custom", path: ["publishedAt"], message: "Choose a future publication date." });
  if (["PUBLISHED", "SCHEDULED"].includes(data.status) && (!data.excerpt || !data.metaDescription)) ctx.addIssue({ code: "custom", path: ["metaDescription"], message: "Published posts need an excerpt and meta description." });
  if (["PUBLISHED", "SCHEDULED"].includes(data.status) && blogText(data.content).length < 80) ctx.addIssue({ code: "custom", path: ["content"], message: "Write at least 80 characters of article content before publishing." });
});

export type BlogPostInput = z.input<typeof blogPostSchema>;

export function blogText(node: BlogNode): string {
  return `${node.text ?? ""} ${(node.content ?? []).map(blogText).join(" ")}`.trim();
}

export function readingMinutes(node: BlogNode): number {
  return Math.max(1, Math.ceil(blogText(node).split(/\s+/).filter(Boolean).length / 200));
}
