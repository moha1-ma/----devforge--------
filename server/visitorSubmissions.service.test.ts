import { beforeEach, describe, expect, it, vi } from "vitest";
const values = vi.fn(); const returningId = vi.fn(); const insert = vi.fn(); const getDb = vi.fn(); const storagePut = vi.fn(); const storageGet = vi.fn();
vi.mock("./db", () => ({ getDb }));
vi.mock("./storage", () => ({ storageGet, storagePut, storageGetSignedUrl: vi.fn() }));
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

describe("listApprovedVisitorFeed", () => {
  beforeEach(() => vi.clearAllMocks());
  it("defensively excludes non-approved submissions and code attachments from the public shape", async () => {
    const pageLimit = vi.fn().mockResolvedValue([{ id: 9, status: "approved", visitorAlias: "زائر", category: "media", title: "فيديو", content: "وسيط مرئي معتمد للموجز العام.", mediaReferenceUrl: "https://www.youtube.com/watch?v=example", createdAt: new Date("2026-01-01") }, { id: 8, status: "pending", visitorAlias: "خاص", category: "code", title: "معلق", content: "محتوى لا يجب أن يظهر في الموجز العام.", mediaReferenceUrl: null, createdAt: new Date("2026-01-02") }]);
    const pageWhere = vi.fn(() => ({ orderBy: () => ({ limit: pageLimit }) }));
    const attachmentsWhere = vi.fn().mockResolvedValue([{ id: 4, submissionId: 9, kind: "video", mimeType: "video/webm", safeName: "clip.webm", storageKey: "visitor/approved/clip.webm" }, { id: 5, submissionId: 9, kind: "code", mimeType: "text/plain", safeName: "unsafe.ts", storageKey: "visitor/approved/unsafe.ts" }]);
    const select = vi.fn().mockReturnValueOnce({ from: () => ({ where: pageWhere }) }).mockReturnValueOnce({ from: () => ({ where: attachmentsWhere }) });
    getDb.mockResolvedValue({ select }); storageGet.mockResolvedValue({ url: "/manus-storage/visitor/approved/clip.webm" });
    const { listApprovedVisitorFeed } = await import("./visitorSubmissions");
    const result = await listApprovedVisitorFeed({ limit: 6 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 9, mediaReferenceUrl: "https://www.youtube.com/watch?v=example", attachments: [{ kind: "video", url: "/manus-storage/visitor/approved/clip.webm" }] });
    expect(JSON.stringify(result)).not.toContain("unsafe.ts");
    expect(JSON.stringify(result)).not.toContain("خاص");
  });
});
