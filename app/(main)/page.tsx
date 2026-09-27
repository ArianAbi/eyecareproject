import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { Glasses, ClipboardList, MessagesSquare, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingVideo from "@/components/landing-video";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSettings();
  return {
    title: { absolute: siteName },
    description: `سامانه ${siteName} برای تامین عدسی عینک فروشگاه‌ها و همکاران اپتیک؛ ثبت سفارش عدسی، پیگیری وضعیت، مدیریت صورتحساب و ارتباط با پشتیبانی.`,
    alternates: { canonical: "/" },
    openGraph: {
      siteName,
      title: `${siteName} | پخش عدسی عینک ویژه همکاران`,
      description:
        "ثبت و پیگیری سفارش عدسی برای فروشگاه‌های عینک و همکاران اپتیک",
      locale: "fa_IR",
      type: "website",
      url: "/",
    },
  };
}

export default function Home() {
  return (
    <>
      <div className="relative isolate">
        <LandingVideo trackElementId="video-trigger" topOffset={100}>
          <div className="size-full flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-shadow-2xs text-shadow-black">
              SalimOptic
            </h1>

            <div className="w-full max-w-lg mx-auto px-6 text-xl lg:text-2xl font-semibold text-wrap relative">
              <div className="radial-gradient-shadow z-[-1] scale-y-200"></div>
              <h1 className="text-shadow-2xs text-shadow-black">
                فروش و تحویل فوری عدسی برای مغازه داران و فروشنده های اپتیک
              </h1>
            </div>

            <div className="space-x-2 mt-6">
              <Link
                href={"/login"}
                className={buttonVariants({
                  variant: "green",
                })}
              >
                ورود به حساب
              </Link>

              <Link
                href={"/signup"}
                className={buttonVariants({ variant: "boldOutline" })}
              >
                ساخت حساب
              </Link>
            </div>

            <div className="mt-4 text-sm">
              <h2>
                <span>شماره تماس جهت مشاوره : </span>
                <span dir="ltr">0912 003 4497</span>
              </h2>
            </div>
          </div>
        </LandingVideo>
      </div>
    </>
  );
}
