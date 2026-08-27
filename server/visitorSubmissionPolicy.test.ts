import { describe, expect, it } from "vitest";
import { validateMediaReferenceUrl, validateVisitorAttachment, validateVisitorSubmission, visitorSubmissionPolicyCopy } from "../shared/visitorSubmissionPolicy";

const codeBase64 = Buffer.from("print('safe proposal')", "utf8").toString("base64");

describe("visitor submission policy", () => {
  it("accepts text code as an attachment without granting execution", () => {
    expect(validateVisitorAttachment({ name: "proposal.py", mimeType: "text/plain", base64: codeBase64 })).toMatchObject({ kind: "code", safeName: "proposal.py" });
    expect(visitorSubmissionPolicyCopy).toContain("لا تُشغّل ملفات الكود");
  });

  it("rejects missing privacy consent, dangerous filenames, and unsupported binary attachments", () => {
    expect(() => validateVisitorSubmission({ category: "opinion", title: "فكرة مفيدة", content: "هذه مشاركة تجريبية مفيدة وواضحة.", consentAccepted: false, attachments: [] })).toThrow("الموافقة");
    expect(() => validateVisitorAttachment({ name: "../evil.exe", mimeType: "application/octet-stream", base64: "AA==" })).toThrow();
  });

  it("permits only explicit HTTPS references from approved media providers", () => {
    expect(validateMediaReferenceUrl("https://www.youtube.com/watch?v=example")).toContain("youtube.com");
    expect(() => validateMediaReferenceUrl("http://youtube.com/watch?v=example")).toThrow("HTTPS");
    expect(() => validateMediaReferenceUrl("https://untrusted.example/video")).toThrow("مزود فيديو مسموح");
  });
});
