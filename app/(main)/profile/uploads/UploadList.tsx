"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageIcon, Trash2 } from "lucide-react";
import { deleteFileAction } from "@/lib/actions/files.action";
import { Button } from "@/components/ui/button";

type Asset = { filename: string; size: number; originalName: string; mimeType: string; visibility: "PRIVATE" | "PUBLIC" };

export default function UploadList({ assets }: { assets: Asset[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return <section className="space-y-3"><h2 className="text-lg font-semibold">فایل‌های بارگذاری‌شده</h2><p role="alert" className="text-sm text-destructive">{error}</p>{assets.length === 0 ? <p className="text-sm text-muted-foreground">هنوز فایلی بارگذاری نکرده‌اید.</p> : <ul className="divide-y rounded-xl border">{assets.map(asset => <li key={asset.filename} className="flex items-center gap-3 p-3">
    {asset.mimeType === "application/pdf" ? <FileText className="size-5 shrink-0" /> : <ImageIcon className="size-5 shrink-0" />}
    <a href={`/api/files/${asset.filename}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-primary hover:underline">{asset.originalName || asset.filename}</a>
    <span className="hidden text-xs text-muted-foreground sm:inline">{Math.ceil(asset.size / 1024)} KB · {asset.visibility === "PUBLIC" ? "عمومی" : "خصوصی"}</span>
    <Button type="button" size="icon" variant="ghost" disabled={pending} aria-label={`حذف ${asset.originalName || asset.filename}`} onClick={() => startTransition(async () => {
      try { const result = await deleteFileAction(`/api/files/${asset.filename}`); if (!result.success) setError(result.error); else { setError(""); router.refresh(); } }
      catch { setError("حذف فایل انجام نشد. دوباره تلاش کنید."); }
    })}><Trash2 className="size-4" /></Button>
  </li>)}</ul>}</section>;
}
