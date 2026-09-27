import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { Glasses, ClipboardList, MessagesSquare, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
          <div className="size-full flex items-center justify-center">
            <div className="w-full max-w-lg mx-auto px-6 text-xl font-semibold text-wrap relative">
              <div
                className={cn(
                  ".radial-gradient-shadow",
                  "absolute size-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-110",
                )}
              ></div>

              <h1>
                فروش عمده و فوری عدسی برای مغازه داران و فروشنده های اپتیک
              </h1>
            </div>
          </div>
        </LandingVideo>
      </div>
    </>
  );
}
