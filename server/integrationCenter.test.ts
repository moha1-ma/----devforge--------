import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), select: vi.fn(), insert: vi.fn(), values: vi.fn(), onDuplicateKeyUpdate: vi.fn(), where: vi.fn(), limit: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { requestIntegrationPreference } from "./integrationCenter";

describe("integration preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.onDuplicateKeyUpdate.mockResolvedValue(undefined);
    mocks.values.mockReturnValue({ onDuplicateKeyUpdate: mocks.onDuplicateKeyUpdate });
    mocks.insert.mockReturnValue({ values: mocks.values });
    mocks.limit.mockResolvedValue([{ id: 8, ownerId: 7, providerKey: "github", status: "request-recorded", requestedScope: "metadata-only" }]);
    mocks.where.mockReturnValue({ limit: mocks.limit });
    mocks.select.mockReturnValue({ from: () => ({ where: mocks.where }) });
    mocks.getDb.mockResolvedValue({ select: mocks.select, insert: mocks.insert });
  });

  it("rejects unknown providers before touching the database", async () => {
    await expect(requestIntegrationPreference({ ownerId: 7, providerKey: "unlisted-provider" })).rejects.toThrow("غير مدعومة");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("stores and reads only the requested owner-scoped provider preference without secrets", async () => {
    const result = await requestIntegrationPreference({ ownerId: 7, providerKey: "github" });
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, providerKey: "github", status: "request-recorded", requestedScope: "metadata-only" }));
    expect(mocks.values.mock.calls[0][0]).not.toHaveProperty("token");
    expect(mocks.values.mock.calls[0][0]).not.toHaveProperty("apiKey");
    expect(mocks.limit).toHaveBeenCalledWith(1);
    expect(result).toMatchObject({ ownerId: 7, providerKey: "github" });
  });
});
