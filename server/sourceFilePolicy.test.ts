import { describe, expect, it } from "vitest";
import { detectSourceLanguage, normalizeSourcePath, validateSourceFile } from "../shared/sourceFilePolicy";

describe("source file policy", () => {
  it("normalizes safe, nested developer paths", () => {
    expect(normalizeSourcePath("\\src\\app.tsx")).toBe("src/app.tsx");
    expect(detectSourceLanguage("src/api/main.py")).toBe("python");
  });

  it("rejects traversal, binary, and unsupported source inputs", () => {
    expect(() => normalizeSourcePath("../secret.ts")).toThrow("مسار");
    expect(() => validateSourceFile("image.png", "x")).toThrow("غير مدعوم");
    expect(() => validateSourceFile("src/file.py", "\u0000")).toThrow("الثنائية");
  });
});
