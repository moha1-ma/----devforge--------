import { beforeEach, describe, expect, it, vi } from "vitest";
const values = vi.fn(); const returningId = vi.fn(); const insert = vi.fn(); const getDb = vi.fn(); const storagePut = vi.fn();
vi.mock("./db", () => ({ getDb }));
vi.mock("./storage", () => ({ storagePut, storageGetSignedUrl: vi.fn() }));
describe("submitVisitorContribution", () => {
  beforeEach(() => { vi.clearAllMocks(); returningId.mockResolvedValue([{ id: 701 }]); values.mockImplementation(() => ({ $returningId: returningId })); insert.mockReturnValue({ values }); getDb.mockResolvedValue({ insert }); storagePut.mockResolvedValue({ key: "private/visitor/701/example.py" }); });
  it("uses the exact insert identifier for attachment storage rather than the newest global submission", async () => {
    const { submitVisitorContribution } = await import("./visitorSubmissions");
    const result = await submitVisitorContribution({ category: "code", title: "ملف مثال", content: "مشاركة كود اختبارية لا تُنفذ داخل المنصة.", consentAccepted: true, attachments: [{ name: "example.py", mimeType: "text/x-python", base64: Buffer.from("print('safe')").toString("base64") }] });
    expect(returningId).toHaveBeenCalledOnce();
    expect(storagePut).toHaveBeenCalledWith("visitor-submissions/pending/701/example.py", expect.anything(), "text/plain; charset=utf-8");
    expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ submissionId: 701 }));
    expect(result).toEqual({ id: 701, status: "pending" });
  });
});
