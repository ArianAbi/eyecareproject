import { z } from "zod";

export const priceSchema = z.number().int("مبلغ باید عدد صحیح باشد").min(0, "مبلغ نمی‌تواند منفی باشد").max(2147483647, "مبلغ بیش از حد مجاز است");
const groupId = z.string().trim().max(64).regex(/^-?[0-9]+$|^$/, "شناسه باید عدد باشد");

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "نام سایت الزامی است").max(100),
  deliveryPrice: priceSchema,
  cutPrice: priceSchema,
  baleGroupId: groupId,
  telegramGroupId: groupId,
});

export const defaultSettings = {
  siteName: "SalimOptic", deliveryPrice: 0, cutPrice: 0,
  baleGroupId: null, telegramGroupId: null,
};
