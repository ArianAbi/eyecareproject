"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../access";
import { writeAudit } from "../audit";
import prisma from "../db";
import { settingsSchema } from "../schemas/settings";

export async function saveSettings(input: unknown) {
  const actor = await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const data = { ...parsed.data, baleGroupId: parsed.data.baleGroupId || null, telegramGroupId: parsed.data.telegramGroupId || null };
  await prisma.$transaction(async tx => {
    await tx.setting.upsert({ where: { id: "global" }, create: { id: "global", ...data }, update: data });
    await writeAudit(tx, actor.id, "SETTINGS_UPDATED", "Setting", "global");
  });
  revalidatePath("/", "layout");
  return { success: true };
}
