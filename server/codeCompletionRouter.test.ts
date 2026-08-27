import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const suggest = vi.hoisted(() => vi.fn());
vi.mock("./codeCompletion", () => ({ createCodeSuggestion: suggest }));
import { ENV } from "./_core/env";
import { appRouter } from "./routers";
function context(openId: string, id: number): TrpcContext { return { user: { id, openId, email: null, name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] }; }
describe("code assistant router", () => { it("rejects visitors and binds accepted suggestions to the owner", async () => { await expect(appRouter.createCaller(context("visitor", 9)).codeAssistant.suggest({ sourceFileId: 4, content: "return value", cursorOffset: 12, mode: "complete" })).rejects.toThrow("مخصصة للمالك فقط"); suggest.mockResolvedValue({ reviewOnly: true, suggestion: "value" }); await appRouter.createCaller(context(ENV.ownerOpenId, 2)).codeAssistant.suggest({ sourceFileId: 4, content: "return value", cursorOffset: 12, mode: "complete" }); expect(suggest).toHaveBeenCalledWith({ ownerId: 2, sourceFileId: 4, content: "return value", cursorOffset: 12, mode: "complete" }); }); });
