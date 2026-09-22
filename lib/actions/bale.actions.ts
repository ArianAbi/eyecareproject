"use server";

export async function BALE_SendMessage(message: string) {
  const token = process.env.BALE_BOT_TOKEN;
  const chatId = process.env.BALE_CHAT_ID;

  const res = await fetch(`https://tapi.bale.ai/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message ?? "پیام تستی از اپ Next.js 🚀",
    }),
  });

  const data = await res.json();

  return data;
}
