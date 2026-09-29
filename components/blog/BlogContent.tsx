import Image from "next/image";
import type { ReactNode } from "react";
import { blogText, isBlogImage, normalizeBlogContent, safeBlogLink, type BlogMark, type BlogNode } from "@/lib/blog-content";

export function headingId(text: string, index: number) {
  const slug = text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return `section-${index}-${slug || "heading"}`;
}

export function blogHeadings(content: unknown) {
  const doc = normalizeBlogContent(content);
  const headings: { id: string; level: number; text: string }[] = [];
  function visit(node: BlogNode) {
    if (node.type === "heading") {
      const text = blogText(node);
      headings.push({ id: headingId(text, headings.length), level: Number(node.attrs?.level || 2), text });
    }
    node.content?.forEach(visit);
  }
  visit(doc);
  return headings;
}

function renderMarks(text: ReactNode, marks?: BlogMark[]) {
  return (marks ?? []).reduce<ReactNode>((child, mark) => {
    switch (mark.type) {
      case "bold": return <strong>{child}</strong>;
      case "italic": return <em>{child}</em>;
      case "underline": return <u>{child}</u>;
      case "strike": return <s>{child}</s>;
      case "code": return <code>{child}</code>;
      case "link": {
        const href = safeBlogLink(mark.attrs?.href);
        return href ? <a href={href} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>{child}</a> : child;
      }
    }
  }, text);
}

export function BlogContent({ content }: { content: unknown }) {
  const doc = normalizeBlogContent(content);
  let headingIndex = 0;
  function render(node: BlogNode, key: number): ReactNode {
    const children = node.content?.map((child, index) => render(child, index));
    const alignment = node.attrs?.textAlign;
    const style = ["left", "right", "center", "justify"].includes(String(alignment)) ? { textAlign: alignment as "left" | "right" | "center" | "justify" } : undefined;
    switch (node.type) {
      case "doc": return <div key={key}>{children}</div>;
      case "text": return <span key={key}>{renderMarks(node.text, node.marks)}</span>;
      case "paragraph": return <p key={key} style={style}>{children}</p>;
      case "heading": {
        const id = headingId(blogText(node), headingIndex++);
        const level = Number(node.attrs?.level);
        if (level === 3) return <h3 key={key} id={id} style={style}>{children}</h3>;
        if (level === 4) return <h4 key={key} id={id} style={style}>{children}</h4>;
        return <h2 key={key} id={id} style={style}>{children}</h2>;
      }
      case "bulletList": return <ul key={key}>{children}</ul>;
      case "orderedList": return <ol key={key}>{children}</ol>;
      case "listItem": return <li key={key}>{children}</li>;
      case "blockquote": return <blockquote key={key}>{children}</blockquote>;
      case "horizontalRule": return <hr key={key} />;
      case "hardBreak": return <br key={key} />;
      case "codeBlock": return <pre key={key}><code>{node.content?.map(child => child.text ?? "").join("")}</code></pre>;
      case "image": return isBlogImage(node.attrs?.src) ? <figure key={key}><Image src={node.attrs.src} alt={String(node.attrs?.alt || "")} width={1200} height={800} sizes="(max-width: 768px) 100vw, 768px" className="h-auto max-w-full rounded-xl" />{node.attrs?.title ? <figcaption>{String(node.attrs.title)}</figcaption> : null}</figure> : null;
      case "table": return <div key={key} className="overflow-x-auto"><table>{children}</table></div>;
      case "tableRow": return <tr key={key}>{children}</tr>;
      case "tableCell": return <td key={key} colSpan={Number(node.attrs?.colspan || 1)} rowSpan={Number(node.attrs?.rowspan || 1)}>{children}</td>;
      case "tableHeader": return <th key={key} colSpan={Number(node.attrs?.colspan || 1)} rowSpan={Number(node.attrs?.rowspan || 1)}>{children}</th>;
      default: return null;
    }
  }
  return <div className="blog-prose">{render(doc, 0)}</div>;
}
