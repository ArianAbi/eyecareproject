import { Lens, Product, Tags } from "@/generated/prisma/client";

export interface LensProductType extends Product {
  lens: Lens | null;
  tags: Tags[];
}