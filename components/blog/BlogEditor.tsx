"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import {
  AlignCenter, AlignRight, Bold, Code2, Columns3, Heading2, Heading3, Heading4,
  ImagePlus, Italic, Link2, List, ListOrdered, Minus, Pilcrow,
  Quote, Redo2, RemoveFormatting, Rows3, Strikethrough, Table2,
  Trash2, Underline as UnderlineIcon, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MediaPickerDialog } from "@/components/media/MediaPickerDialog";
import { safeBlogLink, type BlogNode } from "@/lib/blog-content";
import { cn } from "@/lib/utils";

type Tool = { label: string; icon: React.ComponentType<{ className?: string }>; action: () => void; active?: boolean; disabled?: boolean; badge?: "+" | "−" };

export function BlogEditor({ initial, onChange }: { initial: BlogNode; onChange: (value: BlogNode) => void }) {
  const [error, setError] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false, underline: false }),
      Link.configure({ openOnClick: false }), Underline,
      Image.configure({ allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
    ],
    content: initial,
    onUpdate({ editor: current }) {
      // ProseMirror attrs may have a null prototype. Keep React state plain JSON.
      onChange(JSON.parse(JSON.stringify(current.getJSON())) as BlogNode);
    },
    editorProps: { attributes: { class: "blog-prose min-h-[32rem] focus:outline-none" } },
  });

  if (!editor) return <div className="min-h-96 rounded-2xl border bg-card p-5 text-muted-foreground">در حال بارگذاری ویرایشگر…</div>;

  const groups: Tool[][] = [
    [
      { label: "متن معمولی", icon: Pilcrow, action: () => editor.chain().focus().setParagraph().run(), active: editor.isActive("paragraph") },
      { label: "تیتر سطح ۲", icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
      { label: "تیتر سطح ۳", icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
      { label: "تیتر سطح ۴", icon: Heading4, action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: editor.isActive("heading", { level: 4 }) },
    ],
    [
      { label: "پررنگ", icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
      { label: "مورب", icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
      { label: "زیرخط", icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
      { label: "خط‌خورده", icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
      { label: "پاک کردن قالب‌بندی", icon: RemoveFormatting, action: () => editor.chain().focus().unsetAllMarks().clearNodes().run() },
    ],
    [
      { label: "فهرست نشانه‌دار", icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
      { label: "فهرست شماره‌دار", icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
      { label: "نقل‌قول", icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
      { label: "بخش کد", icon: Code2, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock") },
      { label: "جداکننده", icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [
      { label: "پیوند", icon: Link2, action: () => {
        const value = window.prompt("نشانی پیوند:", editor.getAttributes("link").href || "");
        if (value === null) return;
        if (!value) { editor.chain().focus().unsetLink().run(); return; }
        const href = safeBlogLink(value);
        if (!href) { setError("نشانی پیوند معتبر نیست."); return; }
        editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      }, active: editor.isActive("link") },
      { label: "درج جدول", icon: Table2, action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: "افزودن ردیف جدول", icon: Rows3, badge: "+", action: () => editor.chain().focus().addRowAfter().run(), disabled: !editor.can().addRowAfter() },
      { label: "حذف ردیف جدول", icon: Rows3, badge: "−", action: () => editor.chain().focus().deleteRow().run(), disabled: !editor.can().deleteRow() },
      { label: "افزودن ستون جدول", icon: Columns3, badge: "+", action: () => editor.chain().focus().addColumnAfter().run(), disabled: !editor.can().addColumnAfter() },
      { label: "حذف ستون جدول", icon: Columns3, badge: "−", action: () => editor.chain().focus().deleteColumn().run(), disabled: !editor.can().deleteColumn() },
      { label: "حذف کل جدول", icon: Trash2, action: () => editor.chain().focus().deleteTable().run(), disabled: !editor.can().deleteTable() },
      { label: "راست‌چین", icon: AlignRight, action: () => editor.chain().focus().setTextAlign("right").run() },
      { label: "وسط‌چین", icon: AlignCenter, action: () => editor.chain().focus().setTextAlign("center").run() },
    ],
    [
      { label: "بازگشت", icon: Undo2, action: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
      { label: "تکرار", icon: Redo2, action: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
    ],
  ];

  return <div className="rounded-2xl border bg-card">
    <div className="sticky top-0 z-30 rounded-t-2xl border-b bg-card/95 shadow-sm backdrop-blur" role="toolbar" aria-label="ابزارهای ویرایش مقاله">
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 sm:flex-wrap sm:overflow-visible">
        {groups.map((group, index) => <div key={index} className="flex shrink-0 items-center gap-1">
          {index > 0 && <Separator orientation="vertical" className="mx-1 h-6" />}
          {group.map(({ label, icon: Icon, action, active, disabled, badge }) => <Button key={label} type="button" size="icon" variant={active ? "secondary" : "ghost"} title={label} aria-label={label} aria-pressed={active || false} disabled={disabled} onClick={action} className={cn("rounded-lg", active && "text-primary")}><span className="relative"><Icon className="size-4" />{badge && <span aria-hidden="true" className="absolute -bottom-1 -right-1 rounded bg-card px-0.5 text-[9px] font-bold leading-none">{badge}</span>}</span></Button>)}
        </div>)}
        <MediaPickerDialog trigger={<Button type="button" size="icon" variant="ghost" title="درج تصویر" aria-label="درج تصویر"><ImagePlus className="size-4" /></Button>} onSelect={asset => editor.chain().focus().setImage({ src: asset.url, alt: asset.altText || asset.title, title: asset.title }).run()} />
      </div>
    </div>
    <div className="px-5 py-6 sm:px-8"><EditorContent editor={editor} /></div>
    {error && <p role="alert" className="px-5 pb-4 text-sm text-destructive">{error}</p>}
  </div>;
}
