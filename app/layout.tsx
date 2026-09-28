import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import "./globals.css";
import { cn } from "@/lib/utils";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/toast";
import { SessionProvider } from "next-auth/react";
import { TrafficTracker } from "@/components/core/TrafficTracker";
import localFont from "next/font/local";

const rubik = localFont({
  src: [
    {
      path: "../public/fonts/rubik/Rubik-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/rubik/Rubik-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/rubik/Rubik-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/rubik/Rubik-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/rubik/Rubik-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/rubik/Rubik-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/rubik/Rubik-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/rubik/Rubik-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/rubik/Rubik-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/rubik/Rubik-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/rubik/Rubik-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/rubik/Rubik-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/fonts/rubik/Rubik-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/rubik/Rubik-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-rubik",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSettings();
  return {
    metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
    title: { default: siteName, template: `%s | ${siteName}` },
    applicationName: siteName,
    openGraph: { siteName, title: siteName },
    twitter: { card: "summary", title: siteName },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn("h-full dark", "antialiased", rubik.variable)}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextTopLoader />
        <TrafficTracker />
        <DirectionProvider direction="rtl">
          <SessionProvider>{children}</SessionProvider>
          <Toaster />
        </DirectionProvider>
      </body>
    </html>
  );
}
