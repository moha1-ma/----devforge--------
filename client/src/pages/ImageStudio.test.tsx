import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ImageStudio from "./ImageStudio";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
let generationOptions: { onError?: (error: Error) => void } | undefined;
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ imageStudio: { list: { invalidate: vi.fn() } } }),
    projects: { list: { useQuery: () => ({ data: [] }) } },
    imageStudio: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      generate: { useMutation: (options: { onError?: (error: Error) => void }) => { generationOptions = options; return { mutate: vi.fn(), isPending: false }; } },
    },
  },
}));

describe("ImageStudio", () => {
  afterEach(cleanup);
  it("renders the owner-only empty studio and a disabled short-prompt action", () => {
    render(<LanguageProvider><ImageStudio /></LanguageProvider>);
    expect(screen.getByText(/استوديو صور AI خاص/)).toBeTruthy();
    expect(screen.getByText(/ابدأ بأول أصل بصري/)).toBeTruthy();
  });

  it("surfaces a generation error without losing the private studio context", () => {
    render(<LanguageProvider><ImageStudio /></LanguageProvider>);
    act(() => { generationOptions?.onError?.(new Error("الخدمة غير متاحة")); });
    expect(screen.getByRole("alert").textContent).toContain("الخدمة غير متاحة");
  });
});
