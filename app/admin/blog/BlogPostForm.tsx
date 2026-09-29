"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Archive, CalendarClock, Check, Eye, FileText, Globe2, ImagePlus, Save, Search, Send, Sparkles, X } from "lucide-react";
import { BlogEditor } from "@/components/blog/BlogEditor";
import { MediaPickerDialog } from "@/components/media/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { saveBlogPost } from "@/lib/actions/admin.blog.actions";
import { blogText, type BlogNode, type BlogPostInput } from "@/lib/blog-content";

type Term = { id: string; name: string };
type Status = BlogPostInput["status"];
const emptyContent: BlogNode = { type: "doc", content: [{ type: "paragraph" }] };
export const emptyBlogPost: BlogPostInput = { title: "", slug: "", excerpt: "", content: emptyContent, status: "DRAFT", publishedAt: null, featured: false, coverImage: null, coverAlt: "", seoTitle: "", metaDescription: "", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "", noindex: false, faq: [], categoryId: null, tagIds: [] };

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 180);
}

function localDateTime(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function TextField({ id, label, value, onChange, description, maxLength, multiline = false, placeholder }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  description?: string; maxLength?: number; multiline?: boolean; placeholder?: string;
}) {
  return <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {multiline ? <Textarea id={id} value={value} onChange={event => onChange(event.target.value)} maxLength={maxLength} placeholder={placeholder} className="min-h-24 bg-background" />
      : <Input id={id} value={value} onChange={event => onChange(event.target.value)} maxLength={maxLength} placeholder={placeholder} className="h-10 bg-background" />}
    {(description || maxLength) && <p className="text-xs leading-5 text-muted-foreground">{description}{maxLength && <span className="ms-2" dir="ltr">{value.length}/{maxLength}</span>}</p>}
  </div>;
}

const statusChoices: { value: Status; label: string; description: string; icon: typeof FileText }[] = [
  { value: "DRAFT", label: "پیش‌نویس", description: "فقط مدیران می‌بینند", icon: FileText },
  { value: "PUBLISHED", label: "انتشار الآن", description: "برای همه قابل مشاهده", icon: Send },
  { value: "SCHEDULED", label: "انتشار زمان‌بندی‌شده", description: "در زمان انتخاب‌شده نمایش داده می‌شود", icon: CalendarClock },
  { value: "ARCHIVED", label: "بایگانی", description: "از وبلاگ عمومی برداشته می‌شود", icon: Archive },
];

export function BlogPostForm({ id, initial, categories, tags }: { id?: string; initial: BlogPostInput; categories: Term[]; tags: Term[] }) {
  const router = useRouter();
  const [form, setForm] = useState<BlogPostInput>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const slugLocked = Boolean(id && (initial.status === "PUBLISHED" || initial.status === "SCHEDULED"));
  const bodyLength = blogText(form.content as BlogNode).length;
  const checks = [
    { label: "عنوان مقاله", done: form.title.trim().length >= 5 },
    { label: "نشانی مقاله", done: form.slug.trim().length >= 2 },
    { label: "خلاصه کوتاه", done: Boolean(form.excerpt.trim()) },
    { label: "متن مقاله", done: bodyLength >= 80 },
    { label: "توضیح جستجو", done: Boolean(form.metaDescription.trim()) },
    ...(form.coverImage ? [{ label: "متن جایگزین تصویر", done: Boolean(form.coverAlt.trim()) }] : []),
  ];
  const completedChecks = checks.filter(check => check.done).length;

  function set<K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try {
      // Serialize Tiptap JSON before crossing the Server Action boundary.
      const result = await saveBlogPost(JSON.stringify(form), id);
      if (!result.success) { setError(result.error); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      setMessage(form.status === "PUBLISHED" ? "مقاله منتشر شد." : "مقاله ذخیره شد.");
      if (!id) router.replace(`/admin/blog/${result.id}`);
      router.refresh();
    } catch { setError("ذخیره مقاله انجام نشد. دوباره تلاش کنید."); window.scrollTo({ top: 0, behavior: "smooth" }); }
    finally { setPending(false); }
  }

  const submitLabel = form.status === "PUBLISHED" ? "انتشار مقاله" : form.status === "SCHEDULED" ? "زمان‌بندی انتشار" : form.status === "ARCHIVED" ? "بایگانی مقاله" : "ذخیره پیش‌نویس";
  const SubmitIcon = form.status === "PUBLISHED" ? Send : form.status === "SCHEDULED" ? CalendarClock : Save;

  return <form onSubmit={submit} className="mx-auto max-w-7xl space-y-6 pb-20">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
      <div className="space-y-2">
        <Link href="/admin/blog" className="text-sm text-muted-foreground hover:text-foreground">← همه مقاله‌ها</Link>
        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{id ? "ویرایش مقاله" : "مقاله جدید"}</h1><Badge variant={form.status === "PUBLISHED" ? "default" : "secondary"}>{statusChoices.find(choice => choice.value === form.status)?.label}</Badge></div>
        <p className="text-sm text-muted-foreground">عنوان و متن را بنویسید، سپس تنظیمات انتشار و نمایش در جستجو را بررسی کنید.</p>
      </div>
      <div className="flex flex-wrap gap-2">{id && <Button type="button" variant="outline" render={<Link href={`/admin/blog/${id}/preview`} target="_blank" />}><Eye className="size-4" /> پیش‌نمایش</Button>}<Button type="submit" disabled={pending}><SubmitIcon className="size-4" />{pending ? "در حال ذخیره…" : submitLabel}</Button></div>
    </div>
    {error && <div role="alert" className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {message && <div role="status" className="rounded-xl border border-primary/50 bg-primary/10 p-4 text-sm text-primary">{message}</div>}

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader><CardTitle>شروع مقاله</CardTitle><CardDescription>عنوان اصلی در صفحه مقاله به‌صورت H1 نمایش داده می‌شود.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <TextField id="blog-title" label="عنوان مقاله" value={form.title} onChange={value => setForm(current => ({ ...current, title: value, ...(!slugTouched && !slugLocked ? { slug: slugify(value) } : {}) }))} maxLength={180} placeholder="مثلاً راهنمای انتخاب عدسی مناسب" />
            <TextField id="blog-excerpt" label="خلاصه کوتاه" value={form.excerpt} onChange={value => set("excerpt", value)} multiline maxLength={500} description="در ابتدای مقاله و کارت‌های وبلاگ دیده می‌شود. پاسخ اصلی مطلب را در یک یا دو جمله بنویسید." />
          </CardContent>
        </Card>

        <section aria-labelledby="article-body-title" className="space-y-3">
          <div><h2 id="article-body-title" className="text-xl font-semibold">متن مقاله</h2><p className="mt-1 text-sm text-muted-foreground">برای بخش‌های متن از تیترهای H2 تا H4 استفاده کنید. نوار ابزار هنگام نوشتن در دسترس می‌ماند.</p></div>
          <BlogEditor initial={form.content as BlogNode} onChange={content => set("content", content)} />
          <p className="text-xs text-muted-foreground">{bodyLength} نویسه در متن مقاله · حداقل ۸۰ نویسه برای انتشار</p>
        </section>

        <Card>
          <CardHeader><CardTitle>پرسش‌های متداول</CardTitle><CardDescription>پرسش‌ها و پاسخ‌های این بخش در انتهای مقاله نمایش داده می‌شوند.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {form.faq.map((item, index) => <div key={index} className="space-y-3 rounded-xl border bg-background p-4">
              <TextField id={`faq-question-${index}`} label={`پرسش ${index + 1}`} value={item.question} onChange={value => set("faq", form.faq.map((faq, i) => i === index ? { ...faq, question: value } : faq))} maxLength={200} />
              <TextField id={`faq-answer-${index}`} label="پاسخ" value={item.answer} onChange={value => set("faq", form.faq.map((faq, i) => i === index ? { ...faq, answer: value } : faq))} multiline maxLength={1500} />
              <Button type="button" variant="ghost" size="sm" onClick={() => set("faq", form.faq.filter((_, i) => i !== index))}><X className="size-4" />حذف پرسش</Button>
            </div>)}
            <Button type="button" variant="outline" onClick={() => set("faq", [...form.faq, { question: "", answer: "" }])}>افزودن پرسش</Button>
          </CardContent>
        </Card>
      </div>

      <aside className="min-w-0 space-y-5 xl:sticky xl:top-4" aria-label="تنظیمات مقاله">
        <Card size="sm">
          <CardHeader><CardTitle>انتشار</CardTitle><CardDescription>زمان دیده‌شدن مقاله را مشخص کنید.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2" role="radiogroup" aria-label="وضعیت انتشار">
              {statusChoices.filter(choice => id || choice.value !== "ARCHIVED").map(choice => {
                const Icon = choice.icon;
                return <label key={choice.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${form.status === choice.value ? "border-primary bg-primary/10" : "hover:bg-muted/40"}`}>
                  <input type="radio" name="blog-status" value={choice.value} checked={form.status === choice.value} onChange={() => set("status", choice.value)} className="mt-1 accent-primary" />
                  <Icon className="mt-0.5 size-4 shrink-0" />
                  <span><span className="block text-sm font-medium">{choice.label}</span><span className="block text-xs leading-5 text-muted-foreground">{choice.description}</span></span>
                </label>;
              })}
            </div>
            {form.status === "SCHEDULED" && <div className="space-y-2"><Label htmlFor="blog-scheduled-at">تاریخ و ساعت انتشار</Label><Input id="blog-scheduled-at" type="datetime-local" value={form.publishedAt ? localDateTime(form.publishedAt) : ""} onChange={event => set("publishedAt", event.target.value ? new Date(event.target.value).toISOString() : null)} className="h-10 bg-background" /><p className="text-xs text-muted-foreground">بر اساس ساعت محلی مرورگر شما</p></div>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={event => set("featured", event.target.checked)} className="accent-primary" />نمایش به‌عنوان مقاله ویژه</label>
            <Button type="submit" disabled={pending} className="w-full"><SubmitIcon className="size-4" />{pending ? "در حال ذخیره…" : submitLabel}</Button>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle>نشانی و دسته‌بندی</CardTitle><CardDescription>نشانی از عنوان ساخته می‌شود و می‌توانید پیش از انتشار آن را تغییر دهید.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="blog-slug">بخش پایانی نشانی</Label><Input id="blog-slug" dir="auto" value={form.slug} onChange={event => { setSlugTouched(true); set("slug", slugify(event.target.value)); }} disabled={slugLocked} className="h-10 bg-background" /><p className="break-all rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground" dir="ltr">/blog/{form.slug || "your-article"}</p>{slugLocked && <p className="text-xs text-muted-foreground">نشانی مقاله منتشرشده ثابت می‌ماند تا پیوندهای قبلی کار کنند.</p>}</div>
            <div className="space-y-2"><Label htmlFor="blog-category">دسته‌بندی</Label><select id="blog-category" value={form.categoryId || ""} onChange={event => set("categoryId", event.target.value || null)} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="">بدون دسته‌بندی</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">برچسب‌ها</legend>{tags.length ? <div className="flex flex-wrap gap-2">{tags.map(item => <label key={item.id} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${form.tagIds.includes(item.id) ? "border-primary bg-primary/10" : "hover:bg-muted"}`}><input type="checkbox" checked={form.tagIds.includes(item.id)} onChange={event => set("tagIds", event.target.checked ? [...form.tagIds, item.id] : form.tagIds.filter(id => id !== item.id))} className="sr-only" />{item.name}</label>)}</div> : <p className="text-xs text-muted-foreground">هنوز برچسبی ساخته نشده است.</p>}</fieldset>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle>تصویر شاخص</CardTitle><CardDescription>روی کارت مقاله و بالای صفحه نمایش داده می‌شود.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {form.coverImage && <Image src={form.coverImage} alt={form.coverAlt || "پیش‌نمایش تصویر شاخص"} width={600} height={340} sizes="300px" className="aspect-video w-full rounded-xl object-cover" />}
            <MediaPickerDialog trigger={<Button type="button" variant="outline"><ImagePlus className="size-4" />انتخاب تصویر از رسانه‌ها</Button>} onSelect={asset => setForm(current => ({ ...current, coverImage: asset.url, coverAlt: asset.altText || asset.title }))} />
            <TextField id="blog-cover-alt" label="متن جایگزین تصویر" value={form.coverAlt} onChange={value => set("coverAlt", value)} maxLength={200} description="توصیف کوتاه و دقیق از محتوای تصویر" />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle>نمایش در جستجو</CardTitle><CardDescription>متنی که ممکن است در نتایج جستجو دیده شود.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 rounded-xl border bg-background p-3"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Search className="size-3" />پیش‌نمایش</div><p className="line-clamp-2 text-sm font-medium text-primary">{form.seoTitle || form.title || "عنوان مقاله"}</p><p dir="ltr" className="truncate text-xs text-muted-foreground">/blog/{form.slug || "your-article"}</p><p className="line-clamp-3 text-xs leading-5">{form.metaDescription || form.excerpt || "توضیح کوتاه مقاله"}</p></div>
            <TextField id="blog-meta-description" label="توضیح جستجو" value={form.metaDescription} onChange={value => set("metaDescription", value)} multiline maxLength={320} description="برای انتشار لازم است. خلاصه‌ای روشن از پاسخ و موضوع مقاله بنویسید." />
            {form.excerpt && !form.metaDescription && <Button type="button" size="sm" variant="outline" onClick={() => set("metaDescription", form.excerpt.slice(0, 320))}>استفاده از خلاصه مقاله</Button>}
            <details className="group rounded-xl border p-3"><summary className="cursor-pointer text-sm font-medium">تنظیمات پیشرفته جستجو و اشتراک‌گذاری</summary><div className="mt-4 space-y-4">
              <TextField id="blog-seo-title" label="عنوان جداگانه برای جستجو" value={form.seoTitle} onChange={value => set("seoTitle", value)} maxLength={100} description="اختیاری؛ در حالت خالی عنوان مقاله استفاده می‌شود." />
              <TextField id="blog-canonical" label="نشانی اصلی (canonical)" value={form.canonicalUrl} onChange={value => set("canonicalUrl", value)} placeholder="https://example.com/blog/article" description="اختیاری؛ فقط وقتی مقاله نسخه اصلی در نشانی دیگری دارد." />
              <TextField id="blog-og-title" label="عنوان اشتراک‌گذاری" value={form.ogTitle} onChange={value => set("ogTitle", value)} maxLength={100} description="اختیاری؛ برای پیش‌نمایش در پیام‌رسان‌ها." />
              <TextField id="blog-og-description" label="توضیح اشتراک‌گذاری" value={form.ogDescription} onChange={value => set("ogDescription", value)} multiline maxLength={320} />
              <div className="space-y-2"><Label>تصویر اشتراک‌گذاری</Label><MediaPickerDialog trigger={<Button type="button" variant="outline"><ImagePlus className="size-4" />انتخاب از رسانه‌ها</Button>} onSelect={asset => set("ogImage", asset.url)} />{form.ogImage && <p className="break-all text-xs text-muted-foreground">{form.ogImage}</p>}</div>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.noindex} onChange={event => set("noindex", event.target.checked)} className="mt-1 accent-primary" /><span>این مقاله در نتایج جستجو نمایش داده نشود</span></label>
            </div></details>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader><CardTitle><Sparkles className="me-2 inline size-4" />آماده‌سازی مقاله</CardTitle><CardDescription>{completedChecks} از {checks.length} مورد تکمیل شده است.</CardDescription></CardHeader>
          <CardContent><ul className="space-y-2 text-xs">{checks.map(check => <li key={check.label} className="flex items-center gap-2"><span className={`flex size-4 items-center justify-center rounded-full ${check.done ? "bg-primary text-primary-foreground" : "border text-muted-foreground"}`}>{check.done && <Check className="size-3" />}</span>{check.label}</li>)}</ul><p className="mt-4 text-xs leading-5 text-muted-foreground"><Globe2 className="me-1 inline size-3" />این موارد به خوانایی و نمایه‌سازی کمک می‌کنند؛ رتبه جستجو را تضمین نمی‌کنند.</p></CardContent>
        </Card>
      </aside>
    </div>
  </form>;
}
