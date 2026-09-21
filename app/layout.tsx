import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Noto_Sans_Arabic } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import { Toaster } from "@/components/ui/toast";
import { SessionProvider } from "next-auth/react";
import { TrafficTracker } from "@/components/core/TrafficTracker";

const fontSans = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: { default: "ICN | پخش عدسی عینک", template: "%s | ICN" },
  description: "سامانه سفارش و توزیع عدسی عینک ویژه فروشگاه‌ها و همکاران اپتیک",
  applicationName: "ICN",
  twitter: { card: "summary", title: "ICN | پخش عدسی عینک", description: "سامانه همکاری و سفارش عدسی برای فروشگاه‌های عینک" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // <html
    //   lang="fa"
    //   className={cn("h-full dark", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    // >
    <html
      lang="fa"
      dir="rtl"
      className={cn("h-full dark", "antialiased", fontSans.variable)}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextTopLoader />
        <TrafficTracker />
        <DirectionProvider direction="rtl">
          <SessionProvider>
            {children}
          </SessionProvider>
          <Toaster />
        </DirectionProvider>
      </body>
    </html>
  );
}
