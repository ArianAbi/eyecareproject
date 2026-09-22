import type { Metadata } from "next";
import Link from "next/link";
import { Glasses, ClipboardList, MessagesSquare, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BaleNotif from "../baleSendNotification";

export const metadata: Metadata = {
  title: "49178649",
  description:
    "سامانه ICN برای تامین عدسی عینک فروشگاه‌ها و همکاران اپتیک؛ ثبت سفارش عدسی، پیگیری وضعیت، مدیریت صورتحساب و ارتباط با پشتیبانی.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "ICN | پخش عدسی عینک ویژه همکاران",
    description:
      "ثبت و پیگیری سفارش عدسی برای فروشگاه‌های عینک و همکاران اپتیک",
    locale: "fa_IR",
    type: "website",
    url: "/",
  },
};

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-5 py-10 md:py-16">
      <h1 className="text-lg">49178649</h1>
      <section className="grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Badge variant="outline">ویژه فروشگاه‌های عینک و همکاران اپتیک</Badge>
          <h1 className="text-3xl font-bold leading-relaxed md:text-4xl">
            تامین عدسی برای فروشگاه شما،
            <br />
            <span className="text-primary">با سفارش و پیگیری یکپارچه</span>
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground">
            ICN همراه همکاران در ثبت سفارش عدسی عینک است. مشخصات عدسی را ثبت
            کنید، مراحل آماده‌سازی و ارسال را دنبال کنید و امور مالی فروشگاه را
            از یک پنل مدیریت کنید.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/glasslens-order"
              className={buttonVariants({ size: "lg" })}
            >
              ثبت سفارش عدسی
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              ثبت‌نام همکاران
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            حساب دارید؟{" "}
            <Link href="/login" className="text-foreground underline">
              ورود به پنل همکاران
            </Link>
          </p>
        </div>
        <Card className="bg-muted/40">
          <CardHeader>
            <Glasses className="mb-4 size-12 text-primary" aria-hidden="true" />
            <CardTitle>از ثبت نسخه تا پیگیری سفارش</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-5 text-sm leading-7">
              <li>۱. انتخاب محصول و مشخصات عدسی راست و چپ</li>
              <li>۲. ثبت درخواست عدسی خام یا برش‌خورده</li>
              <li>۳. مشاهده وضعیت سفارش و صورتحساب</li>
            </ol>
          </CardContent>
        </Card>
      </section>
      <section aria-labelledby="services-title" className="space-y-5">
        <h2 id="services-title" className="text-2xl font-semibold">
          ابزارهای روزمره همکاری
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ClipboardList,
              title: "سفارش و پیگیری",
              text: "سفارش‌های فروشگاه را همراه با جزئیات عدسی و آخرین وضعیت بررسی کنید.",
              href: "/orders",
            },
            {
              icon: Wallet,
              title: "موجودی و صورتحساب",
              text: "صورتحساب‌ها، پرداخت آنلاین و درخواست افزایش اعتبار را در یک بخش ببینید.",
              href: "/invoices",
            },
            {
              icon: MessagesSquare,
              title: "پشتیبانی در کنار شما",
              text: "پرسش‌های سفارش و همکاری را در تیکت مطرح کنید و پاسخ‌ها را دنبال کنید.",
              href: "/tickets",
            },
          ].map((item) => (
            <Card key={item.href}>
              <CardHeader>
                <item.icon
                  className="mb-2 size-6 text-primary"
                  aria-hidden="true"
                />
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-5 text-sm leading-7 text-muted-foreground">
                  {item.text}
                </p>
                <Link href={item.href} className="text-sm underline">
                  مشاهده بخش
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="rounded-xl border p-6 md:p-8">
        <h2 className="mb-3 text-xl font-semibold">
          همکاری با فروشگاه‌های عینک
        </h2>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          این سامانه برای تامین عدسی مورد نیاز کسب‌وکارهای اپتیک طراحی شده است.
          برای شروع همکاری حساب بسازید و پرسش‌های خود درباره سفارش و شرایط
          همکاری را از بخش پشتیبانی پیگیری کنید.
        </p>
      </section>
      <footer className="flex flex-wrap justify-between gap-3 border-t pt-6 text-sm text-muted-foreground">
        <span>ICN · سامانه همکاران عدسی عینک</span>
        <Link href="/tickets">ارتباط با پشتیبانی</Link>
      </footer>
    </div>
  );
}
