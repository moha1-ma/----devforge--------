import { describe, expect, it } from "vitest";
import { WEB_PREVIEW_TIMEOUT_MS, completePreview, failPreview, retryPreview, startPreview } from "./previewState";

describe("mobile workspace opening state", () => {
  it("uses a bounded timeout rather than an indefinite loading state", () => {
    expect(WEB_PREVIEW_TIMEOUT_MS).toBe(12_000);
    expect(failPreview(startPreview(), "timeout")).toMatchObject({ loading: false, error: expect.stringMatching(/فتح مساحة العمل/) });
  });
  it("retries with a new preview attempt and clears the previous failure", () => {
    expect(retryPreview(failPreview(startPreview(2), "network"))).toEqual({ attempt: 3, loading: true, error: null });
  });
  it("clears a successful preview state without issuing any network request", () => {
    expect(completePreview(startPreview(4))).toEqual({ attempt: 4, loading: false, error: null });
  });
  it("keeps recovery inside the app without exposing an external production-link action", () => {
    expect(failPreview(startPreview(), "network").error).not.toMatch(/فتح الرابط المنشور/);
  });
});
