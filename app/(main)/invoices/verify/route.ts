import { NextResponse } from "next/server";
import { reconcilePayment } from "@/lib/payment-recovery";
import { allowOperation, requestIdentity } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    if (!await allowOperation("payment-callback", await requestIdentity(), 60)) return new Response("Try later", { status: 429 });
    const authority = url.searchParams.get("Authority") ?? "";
    // The browser's Status is advisory only. Always verify with the provider.
    const result = await reconcilePayment(authority);
    return NextResponse.redirect(new URL(`/invoices/${result.invoiceId}?payment=${result.success ? 'success' : 'failed'}`, url.origin));
  } catch { return NextResponse.redirect(new URL("/invoices?payment=error", url.origin)); }
}
