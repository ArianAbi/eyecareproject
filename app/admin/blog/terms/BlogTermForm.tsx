"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBlogTerm, saveBlogTerm } from "@/lib/actions/admin.blog.actions";

export function BlogTermForm({ kind, item }: { kind: "category" | "tag"; item?: { id: string; name: string; slug: string } }) {
  const router = useRouter();
  const [name, setName] = useState(item?.name || ""); const [slug, setSlug] = useState(item?.slug || ""); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  return <form className="space-y-2" onSubmit={async event => { event.preventDefault(); setPending(true); setError(""); const result = await saveBlogTerm(kind, { name, slug }, item?.id); setPending(false); if (!result.success) { setError(result.error); return; } if (!item) { setName(""); setSlug(""); } router.refresh(); }}><input required value={name} onChange={event => setName(event.target.value)} placeholder="نام" aria-label={item ? `نام ${item.name}` : "نام"} className="w-full rounded-lg border bg-background px-3 py-2" /><input required value={slug} onChange={event => setSlug(event.target.value)} placeholder="نشانی کوتاه" aria-label={item ? `نشانی ${item.name}` : "نشانی کوتاه"} className="w-full rounded-lg border bg-background px-3 py-2" /><div className="flex gap-2"><button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">{item ? "ذخیره" : "افزودن"}</button>{item && <button type="button" disabled={pending} className="rounded-lg border px-4 py-2 text-destructive" onClick={async () => { if (!window.confirm(`«${item.name}» حذف شود؟`)) return; setPending(true); const result = await deleteBlogTerm(kind, item.id); setPending(false); if (!result.success) setError(result.error); else router.refresh(); }}>حذف</button>}</div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form>;
}
