import { describe, expect, it } from "vitest";
import { createNativeBriefRecord, NATIVE_BRIEF_MAX_LENGTH, parseNativeBriefRecord } from "./nativeBrief";

describe("native build brief", () => {
  it("creates a bounded local-only record from a useful build goal", () => {
    expect(createNativeBriefRecord("  أنشئ صفحة هبوط عربية للمشروع  ", 123)).toEqual({
      ok: true,
      record: { content: "أنشئ صفحة هبوط عربية للمشروع", updatedAt: 123 },
    });
  });

  it("rejects empty or oversized content before it can be saved locally", () => {
    expect(createNativeBriefRecord("   ")).toEqual({ ok: false, message: "اكتب هدفًا أو خطوة واحدة على الأقل قبل الحفظ." });
    expect(createNativeBriefRecord("أ".repeat(NATIVE_BRIEF_MAX_LENGTH + 1))).toEqual({
      ok: false,
      message: `اجعل الموجز ${NATIVE_BRIEF_MAX_LENGTH} حرفًا أو أقل.`,
    });
  });

  it("reads only valid saved records and ignores malformed local data", () => {
    expect(parseNativeBriefRecord(JSON.stringify({ content: "اختبر واجهة iPhone", updatedAt: 456 }))).toEqual({
      content: "اختبر واجهة iPhone",
      updatedAt: 456,
    });
    expect(parseNativeBriefRecord("not-json")).toBeNull();
    expect(parseNativeBriefRecord(JSON.stringify({ content: "", updatedAt: 456 }))).toBeNull();
  });
});
