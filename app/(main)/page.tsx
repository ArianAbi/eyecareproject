import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import LandingVideo from "@/components/landing-video";
import { auth } from "@/lib/Auth";
import LandingProductsSummery from "@/components/landing-products-summery";
import prisma from "@/lib/db";
import { blogCardSelect, publishedBlogWhere } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";

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

export default async function Home() {
  const session = await auth();
  const recentPosts = await prisma.blogPost.findMany({ where: { AND: [publishedBlogWhere(), { noindex: false }] }, select: blogCardSelect, orderBy: { publishedAt: "desc" }, take: 3 });

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
              <h1 className="text-shadow-2xs text-center text-shadow-black">
                فروش و تحویل فوری عدسی برای مغازه داران و فروشنده های اپتیک
              </h1>
            </div>

            <div className="space-x-2 mt-6">
              {!session && (
                <>
                  <Link
                    href={"/login"}
                    className={buttonVariants({
                      variant: "accent",
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
                </>
              )}

              {session && session.user && (
                <>
                  <Link
                    href={"/glasslens-order"}
                    className={buttonVariants({
                      variant: "accent",
                    })}
                  >
                    سفارش عدسی
                  </Link>
                </>
              )}
            </div>

            <div className="mt-4 text-sm">
              <h2>
                <span>شماره تماس جهت مشاوره : </span>

                <a href="tel:+989120034497" className="hover:underline">
                  <span
                    dir="ltr"
                    className="shimmer text-sm text-muted-foreground underline font-semibold"
                  >
                    0912 003 4497
                  </span>
                </a>
              </h2>
            </div>
          </div>
        </LandingVideo>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <LandingProductsSummery />
      </div>
      {recentPosts.length > 0 && <section className="mx-auto w-full max-w-6xl space-y-6 px-5 py-12"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-bold">تازه‌های مجله چشم و عینک</h2><Link href="/blog" className="text-primary hover:underline">همه مقاله‌ها</Link></div><div className="grid gap-5 md:grid-cols-3">{recentPosts.map(post => <BlogCard key={post.id} post={post} />)}</div></section>}
    </>
  );
}
