import { z } from "zod";
import { priceSchema } from "./settings";
const power = z.string().regex(/^[+-]?\d+(\.\d+)?$/).refine(v => Math.abs(Number(v)) <= 10 && Number(v) * 4 % 1 === 0);
export const lensSchema = z.object({ positiveFromSph: power, positivToSph: power, negativeFromSph: power, negativeToSph: power, fromCyl: power, toCyl: power }).strict().refine(v =>
  Number(v.positiveFromSph) >= 0 && Number(v.positivToSph) >= Number(v.positiveFromSph) &&
  Number(v.negativeFromSph) <= 0 && Number(v.negativeToSph) <= Number(v.negativeFromSph) &&
  Number(v.fromCyl) <= 0 && Number(v.toCyl) <= Number(v.fromCyl), "Invalid lens range ordering");
export const productSchema = z.object({
  name: z.string().trim().min(3).max(200), description: z.string().trim().min(3).max(5000),
  active: z.boolean(), price: priceSchema, type: z.enum(["LENS", "FRAME", "OTHER"]),
  categoryId: z.string().uuid(), tagIds: z.array(z.string().uuid()).max(100),
  includesGuarantee: z.boolean(), includesBag: z.boolean(), includesSpray: z.boolean(), includesCloth: z.boolean(),
  lens: lensSchema.nullable(),
}).strict();
export const productFormSchema = productSchema.omit({ active: true, tagIds: true, lens: true }).extend({ tags: z.array(z.string().uuid()).max(100), lens: lensSchema });
