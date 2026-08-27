export const marketplaceStoreStatuses = ["draft", "pending", "approved", "rejected", "archived"] as const;
export type MarketplaceStoreStatus = (typeof marketplaceStoreStatuses)[number];

export function normalizeStoreSlug(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (normalized.length < 3 || normalized.length > 72) throw new Error("معرّف المتجر يجب أن يتكون من 3 إلى 72 حرفًا إنجليزيًا أو رقمًا أو شرطة.");
  return normalized;
}

export function validateMarketplaceStore(input: { slug: string; name: string; description: string; category: string }) {
  const slug = normalizeStoreSlug(input.slug);
  const name = input.name.trim(); const description = input.description.trim(); const category = input.category.trim();
  if (name.length < 3 || name.length > 120) throw new Error("اسم المتجر يجب أن يتكون من 3 إلى 120 حرفًا.");
  if (description.length < 20 || description.length > 700) throw new Error("وصف المتجر يجب أن يتكون من 20 إلى 700 حرف.");
  if (category.length < 2 || category.length > 80) throw new Error("فئة المتجر يجب أن تتكون من 2 إلى 80 حرفًا.");
  return { slug, name, description, category };
}

export function canPublishMarketplaceStore(status: MarketplaceStoreStatus) { return status === "approved"; }
