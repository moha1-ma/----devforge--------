import { describe, expect, it } from "vitest";
import { azizDesignBoundary, validateAzizDesignBrief } from "./azizDesignPolicy";

describe("Aziz design policy", () => {
  it("accepts one bounded design brief for a known collection", () => {
    const value = validateAzizDesignBrief({ collectionKey: "aziz-2", title: "بطاقة مؤسسة", brief: "تصميم بطاقة عربية احترافية بمعلومات اتصال عامة وتباين قابل للقراءة." });
    expect(value.collection.capacity).toBe(1500);
    expect(value.collection.assetType).toBe("business-card");
  });
  it("rejects unknown collections and retains non-payment, no-background boundaries", () => {
    expect(() => validateAzizDesignBrief({ collectionKey: "aziz-4", title: "غير صالح", brief: "وصف تصميم كافٍ لاختبار رفض المجموعة غير الموجودة داخل السوق." })).toThrow(/غير معروفة/);
    expect(azizDesignBoundary).toMatchObject({ noFabricatedItems: true, noPriceOrPayment: true, oneDraftPerExplicitRequest: true, noBackgroundGeneration: true });
  });
});
