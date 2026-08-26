import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  addPrivateAiMessage: vi.fn(),
  getGithubProjectLink: vi.fn(),
  getPrivateAiMessages: vi.fn(),
  markPrivateAiThreadManaged: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM: mocks.invokeLLM }));
vi.mock("./privateWorkspace", () => ({
  addPrivateAiMessage: mocks.addPrivateAiMessage,
  getGithubProjectLink: mocks.getGithubProjectLink,
  getPrivateAiMessages: mocks.getPrivateAiMessages,
  markPrivateAiThreadManaged: mocks.markPrivateAiThreadManaged,
}));

import { askPrivateAiAssistant } from "./aiAssistant";

describe("private AI assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPrivateAiMessages.mockResolvedValue([{ role: "user", content: "اشرح الخطة", createdAt: new Date() }]);
    mocks.getGithubProjectLink.mockResolvedValue(null);
    mocks.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "ابدأ بتحديد الجمهور والهدف." } }], usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 } });
  });

  it("stores the submitted question, invokes the bounded managed model, and stores its reply", async () => {
    const result = await askPrivateAiAssistant({ ownerId: 4, threadId: 9, content: "اشرح الخطة" });
    expect(mocks.addPrivateAiMessage).toHaveBeenNthCalledWith(1, { ownerId: 4, threadId: 9, role: "user", content: "اشرح الخطة" });
    expect(mocks.getGithubProjectLink).not.toHaveBeenCalled();
    expect(mocks.invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini", maxCompletionTokens: 420, reasoning: { effort: "minimal" } }));
    const messages = mocks.invokeLLM.mock.calls[0][0].messages;
    expect(messages.some((message: { content: string }) => message.content.includes("سياق GitHub الذي اختاره المالك"))).toBe(false);
    expect(mocks.addPrivateAiMessage).toHaveBeenLastCalledWith({ ownerId: 4, threadId: 9, role: "assistant", content: "ابدأ بتحديد الجمهور والهدف." });
    expect(mocks.markPrivateAiThreadManaged).toHaveBeenCalledWith(4, 9);
    expect(result.model).toBe("gpt-5-mini");
  });

  it("adds only owner-selected repository metadata as bounded GitHub context", async () => {
    mocks.getGithubProjectLink.mockResolvedValue({ repositoryFullName: "owner/devforge-api", defaultBranch: "main" });
    await askPrivateAiAssistant({ ownerId: 4, threadId: 9, content: "كيف أرتب الإصلاح؟", githubProjectId: 7 });
    expect(mocks.getGithubProjectLink).toHaveBeenCalledWith(4, 7);
    const messages = mocks.invokeLLM.mock.calls[0][0].messages;
    expect(messages).toContainEqual(expect.objectContaining({ role: "system", content: expect.stringContaining("owner/devforge-api") }));
    expect(messages).toContainEqual(expect.objectContaining({ role: "system", content: expect.stringContaining("ليست قراءة مباشرة من GitHub") }));
  });

  it("rejects a project without an owner-approved GitHub link before invoking the model", async () => {
    await expect(askPrivateAiAssistant({ ownerId: 4, threadId: 9, content: "راجع هذا", githubProjectId: 77 })).rejects.toThrow("اختر مستودع GitHub");
    expect(mocks.getGithubProjectLink).toHaveBeenCalledWith(4, 77);
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("keeps requested research transparent until an in-app provider is configured", async () => {
    const result = await askPrivateAiAssistant({ ownerId: 4, threadId: 9, content: "حلل هذه الفكرة", researchMode: "trusted-web" });
    const messages = mocks.invokeLLM.mock.calls[0][0].messages;
    expect(messages).toContainEqual(expect.objectContaining({ role: "system", content: expect.stringContaining("لا تدّع إجراء بحث") }));
    expect(result.research).toMatchObject({ requested: true, executed: false, provider: "not-configured" });
  });
});
