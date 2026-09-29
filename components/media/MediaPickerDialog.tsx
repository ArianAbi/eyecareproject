"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Search } from "lucide-react";
import { uploadBlogImage } from "@/lib/actions/admin.blog-images.actions";
import { listMediaForPicker } from "@/lib/actions/admin.media.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type MediaSelection = { filename: string; url: string; title: string; altText: string; width: number | null; height: number | null };

export function MediaPickerDialog({ onSelect, onChanged, trigger }: {
  onSelect?: (asset: MediaSelection) => void;
  onChanged?: () => void;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaSelection[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    void listMediaForPicker(query, page).then(result => {
      if (active) { setAssets(result.assets); setTotal(result.total); setError(""); }
    }).catch(() => { if (active) setError("بارگذاری رسانه‌ها انجام نشد."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, query, page]);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) { setError("یک تصویر انتخاب کنید."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData();
      form.set("image", file); form.set("title", title); form.set("altText", altText);
      form.set("description", description); form.set("keywords", keywords);
      const result = await uploadBlogImage(form);
      if (!result.success) { setError(result.error); return; }
      const filename = result.url.split("/").pop()!;
      const selected = { filename, url: result.url, title: title.trim(), altText: altText.trim(), width: result.width, height: result.height };
      onChanged?.();
      onSelect?.(selected);
      setOpen(false); setFile(null); setTitle(""); setAltText(""); setDescription(""); setKeywords("");
    } catch { setError("بارگذاری تصویر انجام نشد. دوباره تلاش کنید."); }
    finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={nextOpen => { setOpen(nextOpen); if (nextOpen) setLoading(true); }}>
    <DialogTrigger render={trigger ?? <Button type="button"><ImagePlus className="size-4" />افزودن رسانه</Button>} />
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
      <DialogHeader><DialogTitle>کتابخانه رسانه</DialogTitle><DialogDescription>تصویر عمومی انتخاب کنید یا تصویر جدیدی با اطلاعات توصیفی بارگذاری کنید.</DialogDescription></DialogHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="space-y-3"><h3 className="font-semibold">تصاویر موجود</h3>
          <form onSubmit={event => { event.preventDefault(); setLoading(true); setPage(1); setQuery((event.currentTarget.elements.namedItem("media-search") as HTMLInputElement).value.trim()); }} className="flex gap-2"><Input name="media-search" aria-label="جستجوی رسانه" maxLength={100} placeholder="عنوان یا متن جایگزین..." /><Button type="submit" variant="outline" size="icon" aria-label="جستجو"><Search className="size-4" /></Button></form>
          {loading ? <p className="text-sm text-muted-foreground">در حال بارگذاری...</p> : assets.length ? <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">{assets.map(asset => <button key={asset.filename} type="button" onClick={() => { onSelect?.(asset); if (onSelect) setOpen(false); }} className="overflow-hidden rounded-xl border text-right hover:border-primary focus-visible:outline-2 focus-visible:outline-primary" title={asset.altText || asset.title}>
            <Image src={asset.url} alt={asset.altText || asset.title || "تصویر رسانه"} width={220} height={150} className="aspect-square w-full object-cover" /><span className="block truncate p-2 text-xs">{asset.title || asset.filename}</span></button>)}</div> : <p className="rounded-xl border p-5 text-sm text-muted-foreground">تصویری پیدا نشد.</p>}
          {total > 18 && <div className="flex items-center justify-center gap-3 text-xs"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => { setLoading(true); setPage(page - 1); }}>قبل</Button><span>{page} از {Math.ceil(total / 18)}</span><Button size="sm" variant="outline" disabled={page * 18 >= total} onClick={() => { setLoading(true); setPage(page + 1); }}>بعد</Button></div>}
        </section>
        <form onSubmit={upload} className="space-y-3"><h3 className="font-semibold">بارگذاری تصویر جدید</h3>
          <div className="space-y-1"><Label htmlFor="media-picker-file">تصویر</Label><Input id="media-picker-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} required /><p className="text-xs text-muted-foreground">JPEG، PNG یا WebP؛ حداکثر ۵ مگابایت. تصویر به WebP تبدیل می‌شود.</p></div>
          <div className="space-y-1"><Label htmlFor="media-picker-title">عنوان تصویر</Label><Input id="media-picker-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required placeholder="مثلاً راهنمای انتخاب عدسی طبی" /></div>
          <div className="space-y-1"><Label htmlFor="media-picker-alt">متن جایگزین (Alt)</Label><Input id="media-picker-alt" value={altText} onChange={event => setAltText(event.target.value)} maxLength={200} required placeholder="آنچه واقعاً در تصویر دیده می‌شود" /></div>
          <div className="space-y-1"><Label htmlFor="media-picker-description">توضیح و زمینه تصویر</Label><Textarea id="media-picker-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={500} placeholder="اطلاعات دقیق و مفید برای نویسنده و موتور جستجو" /></div>
          <div className="space-y-1"><Label htmlFor="media-picker-keywords">برچسب‌ها</Label><Input id="media-picker-keywords" value={keywords} onChange={event => setKeywords(event.target.value)} placeholder="عدسی، عینک، مراقبت چشم" /><p className="text-xs text-muted-foreground">با ویرگول جدا کنید؛ حداکثر ۱۲ برچسب.</p></div>
          <Button type="submit" disabled={busy}>{busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? "در حال بارگذاری..." : "بارگذاری تصویر"}</Button>
        </form>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </DialogContent>
  </Dialog>;
}
