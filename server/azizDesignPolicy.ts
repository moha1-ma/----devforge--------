import { z } from "zod";
import { findAzizCollection } from "../shared/azizDesignCatalog";

const briefSchema = z.object({
  collectionKey: z.string().trim().min(1),
  title: z.string().trim().min(3).max(160),
  brief: z.string().trim().min(24).max(4000),
});

export function validateAzizDesignBrief(input: unknown) {
  const values = briefSchema.parse(input);
  const collection = findAzizCollection(values.collectionKey);
  if (!collection) throw new Error("مجموعة تصميم عزوز غير معروفة.");
  return { ...values, collection };
}

export const azizDesignBoundary = {
  noFabricatedItems: true,
  noPriceOrPayment: true,
  ownerReviewRequired: true,
  oneDraftPerExplicitRequest: true,
  noBackgroundGeneration: true,
  noAutomaticExternalMedia: true,
} as const;
