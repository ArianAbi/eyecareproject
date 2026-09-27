import { z } from "zod";
export class ExpectedError extends Error {}
export class ClientActionError extends Error {}
export type ActionFailure = { success: false; error: string };
export async function actionResult<T>(operation: () => Promise<T>): Promise<T | ActionFailure> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof ExpectedError) return { success: false, error: error.message };
    if (error instanceof z.ZodError) return { success: false, error: "اطلاعات واردشده معتبر نیست. فیلدها و محدوده‌های مجاز را بررسی کنید." };
    console.error("Action failed", error);
    return { success: false, error: "انجام این عملیات ممکن نشد. صفحه را تازه کنید و دوباره تلاش کنید." };
  }
}
/** Called in the browser after receiving a serializable result, never across the server boundary. */
export function unwrapActionResult<T>(result: T): Exclude<T, ActionFailure> {
  if (result && typeof result === "object" && "success" in result && result.success === false) {
    throw new ClientActionError("error" in result && typeof result.error === "string" ? result.error : "عملیات انجام نشد.");
  }
  return result as Exclude<T, ActionFailure>;
}
