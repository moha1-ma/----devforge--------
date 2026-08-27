import { describe, expect, it } from "vitest";
import { isSiteNotificationLink, normalizeSiteNotification } from "../shared/siteNotificationPolicy";

describe("site notification policy", () => {
  it("accepts only bounded content and approved internal links", () => {
    expect(normalizeSiteNotification({ category: "review", title: "عنوان", body: "نص الإشعار", link: "/visitor-review" })).toMatchObject({ link: "/visitor-review" });
    expect(isSiteNotificationLink("https://example.com")).toBe(false);
    expect(() => normalizeSiteNotification({ category: "review", title: "عنوان", body: "نص", link: "/outside" })).toThrow("رابط الإشعار غير مسموح");
  });
});
