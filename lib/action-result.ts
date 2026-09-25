import { z } from "zod";
export class ExpectedError extends Error {}
export class ClientActionError extends Error {}
export type ActionFailure = { success: false; error: string };
export async function actionResult<T>(operation: () => Promise<T>): Promise<T | ActionFailure> {
  try { return await operation(); }
  catch (error) {
    if (error instanceof ExpectedError) return { success: false, error: error.message };
    if (error instanceof z.ZodError) return { success: false, error: "Invalid input. Check the required fields and allowed ranges." };
    console.error("Action failed", error);
    return { success: false, error: "Unable to complete this operation. Refresh and try again." };
  }
}
/** Called in the browser after receiving a serializable result, never across the server boundary. */
export function unwrapActionResult<T>(result: T): Exclude<T, ActionFailure> {
  if (result && typeof result === "object" && "success" in result && result.success === false) {
    throw new ClientActionError("error" in result && typeof result.error === "string" ? result.error : "Operation failed.");
  }
  return result as Exclude<T, ActionFailure>;
}
