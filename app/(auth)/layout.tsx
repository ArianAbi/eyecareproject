import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {Home} from "lucide-react"
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-svh w-full grid place-items-center">
  <Link href="/" className={cn(buttonVariants({variant:"ghost",size:"lg"}),"absolute right-2 top-2")}>
    <Home />
  </Link>
  <main>{children}</main>
  </div>;
}