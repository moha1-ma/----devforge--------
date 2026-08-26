import { describe, expect, it } from "vitest";
import { createWebsiteStarterFiles, isWebsiteVisualPreset } from "./websiteStarter";

describe("website starter generator", () => {
  it("creates a compact editable website starter and escapes supplied page text", () => {
    const files = createWebsiteStarterFiles({ title: "موقع <خاص>", businessType: "استشارات", brief: "نساعد الفرق على ترتيب إطلاق المنتجات الرقمية بثقة ووضوح.", visualPreset: "studio", palette: "cyan", primaryCta: "ابدأ الآن", desiredDomain: "example.com" });
    expect(Object.keys(files)).toEqual(["index.html", "styles.css", "app.js", "README.md"]);
    expect(files["index.html"]).toContain("موقع &lt;خاص&gt;");
    expect(files["styles.css"]).toContain("@media(max-width:720px)");
    expect(files["README.md"]).toContain("example.com");
  });

  it("accepts only the approved visual preset keys", () => {
    expect(isWebsiteVisualPreset("launch")).toBe(true);
    expect(isWebsiteVisualPreset("unknown")).toBe(false);
  });
});
