import "server-only";
import prisma from "./db";

/** Observed post-commit delivery; failure does not undo a committed business operation. */
export async function BALE_SendMessage(message: string) {
  try {
    const token = process.env.BALE_BOT_TOKEN;
    const settings = await prisma.setting.findUnique({ where: { id: "global" }, select: { baleGroupId: true } });
    const chatId = settings?.baleGroupId || process.env.BALE_CHAT_ID;
    if (!token || !chatId) return { success: false };
    const response = await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ chat_id: chatId, text: message.slice(0, 4000) }),
    });
    const body = await response.json();
    if (!response.ok || body.ok !== true) throw new Error("Bale rejected notification");
    return { success: true };
  } catch {
    console.error("Bale notification failed; business transaction remains committed");
    return { success: false };
  }
}
