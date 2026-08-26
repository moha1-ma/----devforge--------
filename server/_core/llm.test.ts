import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./env", () => ({ ENV: { forgeApiKey: "test-key", forgeApiUrl: "https://forge.example" } }));

import { invokeLLM } from "./llm";

describe("invokeLLM GPT token serialization", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses max_completion_tokens when explicitly requested", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "test", created: 0, model: "gpt-5-mini", choices: [{ index: 0, message: { role: "assistant", content: "حاضر" }, finish_reason: "stop" }] }), { status: 200 }));

    await invokeLLM({ model: "gpt-5-mini", maxCompletionTokens: 96, messages: [{ role: "user", content: "مرحبا" }] });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const payload = JSON.parse(String(init.body));
    expect(payload.max_completion_tokens).toBe(96);
    expect(payload.max_tokens).toBeUndefined();
  });
});
