import { cache } from "react";
import prisma from "./db";
import { defaultSettings } from "./schemas/settings";

export const getSettings = cache(async () => {
  return await prisma.setting.findUnique({ where: { id: "global" } }) ?? defaultSettings;
});
