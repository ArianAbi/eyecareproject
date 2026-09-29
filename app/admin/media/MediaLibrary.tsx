"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, ImageIcon, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { MediaPickerDialog } from "@/components/media/MediaPickerDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteMedia, saveMediaMetadata } from "@/lib/actions/admin.media.actions";
import { parseMediaKeywords } from "@/lib/media";

type MediaItem = { filename: string; size: number; width: number | null; height: number | null; title: string; altText: string; description: string; keywords: string[]; createdAt: string; owner: { username: string } };
type MetadataForm = Pick<MediaItem, "title" | "altText" | "description"> & { keywords: string };

export function MediaLibrary({ assets }: { assets: MediaItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [form, setForm] = useState<MetadataForm>({ title: "", altText: "", description: "", keywords: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function edit(asset: MediaItem) {
    setEditing(asset); setError("");
    setForm({ title: asset.title, altText: asset.altText, description: asset.description, keywords: asset.keywords.join("، ") });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true); setError("");
    try {
      const result = await saveMediaMetadata(editing.filename, { ...form, keywords: parseMediaKeywords(form.keywords) });
      if (!result.success) { setError(result.error); return; }
      setEditing(null); setMessage("اطلاعات تصویر ذخیره شد."); router.refresh();
    } catch { setError("ذخیره اطلاعات تصویر انجام نشد."); }
    finally { setBusy(false); }
  }

  async function remove(filename: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await deleteMedia(filename);
      if (!result.success) { setError(result.error); return; }
      setMessage("تصویر حذف شد."); router.refresh();
    } catch { setError("حذف تصویر انجام نشد."); }
    finally { setBusy(false); }
  }

  async function copy(url: string) {
    try { await navigator.clipboard.writeText(new URL(url, window.location.origin).toString()); setMessage("نشانی تصویر کپی شد."); setError(""); }
    catch { setError("کپی نشانی انجام نشد."); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">این تصاویر عمومی هستند. حذف تصویرِ استفاده‌شده در مقاله مجاز نیست.</p><MediaPickerDialog onChanged={() => router.refresh()} onSelect={asset => void copy(asset.url)} /></div>
    {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">{message}</p>}
    {assets.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{assets.map(asset => {
      const url = `/api/blog/images/${asset.filename}`;
      return <Card key={asset.filename} className="min-w-0">
        <div className="relative aspect-video bg-muted"><Image src={url} alt={asset.altText || asset.title || "تصویر رسانه"} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" /></div>
        <CardHeader><CardTitle className="truncate">{asset.title || "بدون عنوان"}</CardTitle><CardDescription className="line-clamp-2 min-h-10">{asset.altText || "متن جایگزین هنوز ثبت نشده است."}</CardDescription></CardHeader>
        <CardContent className="space-y-3"><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : "ابعاد نامشخص"}</span><span>{Math.ceil(asset.size / 1024)} KB</span><span>{asset.owner.username}</span></div>
          {asset.keywords.length > 0 && <p className="line-clamp-1 text-xs text-muted-foreground">{asset.keywords.map(word => `#${word}`).join("  ")}</p>}
          <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => void copy(url)}><Copy className="size-4" />کپی نشانی</Button><Button type="button" size="sm" variant="outline" onClick={() => edit(asset)}><Pencil className="size-4" />ویرایش</Button>
            <AlertDialog><AlertDialogTrigger render={<Button type="button" size="sm" variant="outline" disabled={busy} />}><Trash2 className="size-4" />حذف</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>حذف تصویر؟</AlertDialogTitle><AlertDialogDescription>این کار برگشت‌پذیر نیست. اگر نشانی تصویر خارج از مقالات استفاده شده باشد، آن صفحه نیز تصویر را از دست می‌دهد.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void remove(asset.filename)}>حذف تصویر</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>
        </CardContent>
      </Card>;
    })}</div> : <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground"><ImageIcon className="size-10" /><p>رسانه‌ای پیدا نشد. یک تصویر جدید بارگذاری کنید یا جستجو را تغییر دهید.</p></CardContent></Card>}
    <Dialog open={Boolean(editing)} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>اطلاعات تصویر</DialogTitle><DialogDescription>عنوان و متن جایگزین را دقیق و توصیفی بنویسید. این اطلاعات فقط زمانی به SEO کمک می‌کنند که در صفحه منتشرشده استفاده شوند.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4"><div className="space-y-1"><Label htmlFor="media-title">عنوان</Label><Input id="media-title" value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} maxLength={160} required /></div><div className="space-y-1"><Label htmlFor="media-alt">متن جایگزین (Alt)</Label><Input id="media-alt" value={form.altText} onChange={event => setForm(current => ({ ...current, altText: event.target.value }))} maxLength={200} required /></div><div className="space-y-1"><Label htmlFor="media-description">توضیح و زمینه</Label><Textarea id="media-description" value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} maxLength={500} /></div><div className="space-y-1"><Label htmlFor="media-keywords">برچسب‌ها</Label><Input id="media-keywords" value={form.keywords} onChange={event => setForm(current => ({ ...current, keywords: event.target.value }))} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin" />}ذخیره اطلاعات</Button></form>
    </DialogContent></Dialog>
  </div>;
}
