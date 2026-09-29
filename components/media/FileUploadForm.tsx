"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle } from "lucide-react";
import { uploadFileAction } from "@/lib/actions/files.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FileUploadForm({ allowPublic = false }: { allowPublic?: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [publicUpload, setPublicUpload] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!file || file.size > 5 * 1024 * 1024) { setError("فایل PDF یا تصویر کمتر از ۵ مگابایت انتخاب کنید."); return; }
    setPending(true); setError(""); setMessage("");
    try {
      const form = new FormData(); form.set("file", file);
      form.set("visibility", allowPublic && publicUpload ? "PUBLIC" : "PRIVATE");
      const result = await uploadFileAction(form);
      if (!result.success) { setError(result.error); return; }
      setFile(null); setMessage("فایل بارگذاری شد."); router.refresh();
      formElement.reset();
    } catch { setError("بارگذاری فایل انجام نشد. دوباره تلاش کنید."); }
    finally { setPending(false); }
  }

  return <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4">
    <div className="space-y-1"><Label htmlFor={allowPublic ? "admin-file-upload" : "user-file-upload"}>بارگذاری فایل</Label><Input id={allowPublic ? "admin-file-upload" : "user-file-upload"} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setFile(event.target.files?.[0] ?? null)} required /><p className="text-xs text-muted-foreground">JPEG، PNG، WebP یا PDF؛ حداکثر ۵ مگابایت. تصاویر به WebP تبدیل می‌شوند.</p></div>
    {allowPublic && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={publicUpload} onChange={event => setPublicUpload(event.target.checked)} className="accent-primary" /><span>این فایل عمومی باشد؛ هر فردی با نشانی فایل می‌تواند آن را دریافت کند.</span></label>}
    {!allowPublic && <p className="text-xs text-muted-foreground">فایل شما خصوصی است و فقط شما و مدیران می‌توانید آن را دریافت کنند.</p>}
    <Button type="submit" disabled={pending || !file}><FileUp className="size-4" />{pending ? <><LoaderCircle className="size-4 animate-spin" />در حال بارگذاری...</> : "بارگذاری"}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="text-sm text-primary">{message}</p>}
  </form>;
}
