import { ExpectedError } from "./action-result";
import { z } from "zod";
import { IsInRange } from "./is-in-range";

const power = z.string().max(12).regex(/^[+-]?\d+(\.\d+)?$/).refine(v => Number.isFinite(Number(v)) && Number(v) * 4 % 1 === 0);
export const eyeSchema = z.object({ sph: power, cyl: power, aux: z.string().regex(/^\d{1,3}$/).refine(v => Number(v) <= 180) });
export const cartInputSchema = z.object({ id: z.string().uuid(), od: eyeSchema, os: eyeSchema, odOnly: z.boolean(), rawOrCut: z.boolean() });
type Lens = { positiveFromSph: string; positivToSph: string; negativeFromSph: string; negativeToSph: string; fromCyl: string; toCyl: string };
type Prescription = { od: { sph: string; cyl: string; aux: string }; os: { sph: string; cyl: string; aux: string }; odOnly: boolean };

export function lensEligible(lens: Lens | null, prescription: Prescription): boolean {
  if (!lens || !eyeSchema.safeParse(prescription.od).success || (!prescription.odOnly && !eyeSchema.safeParse(prescription.os).success)) return false;
  const range = { sphPositiveFrom: lens.positiveFromSph, sphPositiveTo: lens.positivToSph, sphNegativeFrom: lens.negativeFromSph, sphNegativeTo: lens.negativeToSph, cylFrom: lens.fromCyl, cylTo: lens.toCyl };
  const valid = (eye: Prescription['od']) => { const value = IsInRange(eye, range); return !!value?.sphInRange && !!value?.cylInRange; };
  return valid(prescription.od) && (prescription.odOnly || valid(prescription.os));
}

export function assertOrderEligibility(userStatus: string, product: { active: boolean; type: string; lens: Lens | null } | null, prescription: Prescription) {
  if (userStatus !== 'VERIFIED') throw new ExpectedError('Account must be verified before ordering.');
  if (!product?.active || product.type !== 'LENS' || !lensEligible(product.lens, prescription)) throw new ExpectedError('Product or prescription is not eligible for ordering.');
}

export function lensPrice(price: number, odOnly: boolean) { return odOnly ? Math.round(price / 2) : price; }

export function storedPrescription(item: { odSph: string; odCyl: string; odAux: string; osSph: string; osCyl: string; osAux: string; odOnly: boolean }): Prescription {
  return { od: { sph: item.odSph, cyl: item.odCyl, aux: item.odAux }, os: { sph: item.osSph, cyl: item.osCyl, aux: item.osAux }, odOnly: item.odOnly };
}
