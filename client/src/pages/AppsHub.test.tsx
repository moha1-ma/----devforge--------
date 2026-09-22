import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppsHub from "./AppsHub";

const mutate = vi.fn();
const listCache = { cancel: vi.fn(), getData: vi.fn(() => []), setData: vi.fn() };

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ appPreferences: { list: listCache } }),
    appPreferences: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      setPinned: { useMutation: () => ({ mutate, isPending: false }) },
      reorder: { useMutation: () => ({ mutate, isPending: false }) },
      touch: { useMutation: () => ({ mutate, isPending: false }) },
    },
  },
}));
vi.mock("wouter", () => ({ useLocation: () => ["/apps", vi.fn()] }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("AppsHub", () => {
  afterEach(() => { cleanup(); localStorage.clear(); mutate.mockClear(); });

  it("shows the complete searchable application directory", () => {
    render(<LanguageProvider><AppsHub /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "مركز التطبيقات" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "كل التطبيقات" })).toBeTruthy();
    expect(screen.getByText("GitHub")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("ابحث باسم التطبيق أو مهمته…"), { target: { value: "GitHub" } });
    expect(screen.getByText("ربط المستودعات وتجميعها ومراجعة تعارضاتها.")).toBeTruthy();
    expect(screen.queryByText("استوديو الصور")).toBeNull();
  });

  it("offers an accessible account-synced pin action", () => {
    render(<LanguageProvider><AppsHub /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "تثبيت GitHub" }));
    expect(mutate).toHaveBeenCalledWith({ appKey: "github", isPinned: true });
  });
});
