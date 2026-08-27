export const azizDesignCollections = [
  {
    key: "aziz-1",
    name: "عزوز 1",
    englishName: "Aziz 1",
    assetType: "website-template",
    capacity: 180,
    accent: "cyan",
    description: "قوالب مواقع ويب قابلة للمراجعة قبل النشر.",
  },
  {
    key: "aziz-2",
    name: "عزوز 2",
    englishName: "Aziz 2",
    assetType: "business-card",
    capacity: 1500,
    accent: "amber",
    description: "تصاميم بطاقات أعمال قابلة للمراجعة قبل النشر.",
  },
  {
    key: "aziz-3",
    name: "عزوز 3",
    englishName: "Aziz 3",
    assetType: "book-cover",
    capacity: 5000,
    accent: "violet",
    description: "تصاميم أغلفة كتب قابلة للمراجعة قبل النشر.",
  },
] as const;

export type AzizCollectionKey = (typeof azizDesignCollections)[number]["key"];
export type AzizAssetType = (typeof azizDesignCollections)[number]["assetType"];

export function findAzizCollection(key: string) {
  return azizDesignCollections.find(collection => collection.key === key);
}
