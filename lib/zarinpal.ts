import "server-only";
import { ExpectedError } from "./action-result";
// API routes/request fields checked against ZarinPal/Android-SDK-Kotlin (see docs/payment-recovery.md).
function configuration() {
  const merchant = process.env.ZARINPAL_MERCHANT_ID;
  const mode = process.env.ZARINPAL_SANDBOX;
  if (!merchant || !/^[0-9a-f-]{36}$/i.test(merchant) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(merchant) || !["true", "false"].includes(mode ?? ""))
    throw new ExpectedError("Payment gateway is not configured.");
  return { merchant, sandbox: mode === "true" };
}
export function paymentUrl(authority: string) {
  const { sandbox } = configuration();
  return `${sandbox ? "https://sandbox.zarinpal.com" : "https://www.zarinpal.com"}/pg/StartPay/${encodeURIComponent(authority)}`;
}
async function request(operation: string, input: Record<string, unknown>) {
  const { merchant, sandbox } = configuration();
  const response = await fetch(`${sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com"}/pg/v4/payment/${operation}.json`, {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ merchant_id: merchant, ...input }),
  });
  if (!response.ok) throw new ExpectedError("Payment provider unavailable. Try again later.");
  return response.json();
}
function amount(amountToman: number) {
  if (!Number.isSafeInteger(amountToman) || amountToman < 1000 || amountToman > 2147483647) throw new ExpectedError("Invalid payment amount.");
  return amountToman * 10;
}
export async function zarinpalRequestPayment(params: { amountToman: number; description: string; callbackUrl: string }) {
  const json = await request("request", { amount: amount(params.amountToman), description: params.description, callback_url: params.callbackUrl });
  if (json.data?.code !== 100 || typeof json.data.authority !== "string" || !/^[A-Za-z0-9]{20,100}$/.test(json.data.authority)) throw new ExpectedError("Payment session could not be created.");
  return { authority: json.data.authority as string, paymentUrl: paymentUrl(json.data.authority) };
}
export async function zarinpalVerifyPayment(params: { amountToman: number; authority: string }) {
  const json = await request("verify", { amount: amount(params.amountToman), authority: params.authority });
  if ([100, 101].includes(json.data?.code) && (typeof json.data.ref_id === "string" || Number.isSafeInteger(json.data.ref_id)))
    return { success: true as const, refId: String(json.data.ref_id) };
  return { success: false as const, refId: null };
}
export async function zarinpalInquiry(authority: string) {
  const json = await request("inquiry", { authority });
  if (json.data?.code !== 100 || typeof json.data.status !== "string") throw new ExpectedError("Payment status is uncertain. Please retry reconciliation later.");
  return json.data.status.toUpperCase() as string;
}
