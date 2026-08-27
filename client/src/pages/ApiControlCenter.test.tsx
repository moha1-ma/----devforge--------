import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ApiControlCenter from "./ApiControlCenter";

const request = vi.fn();
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { system: { health: { useQuery: () => ({ data: { ok: true }, isLoading: false, refetch: vi.fn() }) } }, integrationCenter: { request: { useMutation: () => ({ mutate: request, isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("ApiControlCenter", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });
  it("shows safe active-origin contracts and records an owner review without disconnecting or exposing secrets", () => {
    render(<LanguageProvider><ApiControlCenter /></LanguageProvider>);
    expect(screen.getByText("مركز تحكم DevForge API")).toBeTruthy();
    expect(screen.getByText(`${window.location.origin}/api/trpc/system.health`)).toBeTruthy();
    expect(screen.getByText("متاح")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/sk_|Bearer |service_role|127\.0\.0\.1/);
    fireEvent.click(screen.getByRole("button", { name: "سجل مراجعة فصل API" }));
    expect(request).toHaveBeenCalledWith({ providerKey: "devforge-api-boundary" });
  });
});
