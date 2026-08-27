import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AzizDesignReviewCenter from "./AzizDesignReviewCenter";

const createDraft = vi.fn();
const review = vi.fn();
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ azizMarket: { collections: { invalidate: vi.fn() }, publicAssets: { invalidate: vi.fn() } } }), azizMarket: { collections: { useQuery: () => ({ data: [{ key: "aziz-1", name: "عزوز 1", description: "قوالب مواقع", capacity: 180, approvedCount: 0 }] }) }, mine: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) }, createDraft: { useMutation: () => ({ mutate: createDraft, isPending: false }) }, review: { useMutation: () => ({ mutate: review, isPending: false }) } } } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("AzizDesignReviewCenter", () => {
  afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });
  it("does not generate until the owner supplies a valid brief and explicitly starts one draft", () => {
    render(<LanguageProvider><AzizDesignReviewCenter /></LanguageProvider>);
    expect(createDraft).not.toHaveBeenCalled();
    expect(review).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "إعداد مسودة للمراجعة" }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByPlaceholderText("عنوان التصميم"), { target: { value: "موقع مؤسسة تعليمية" } });
    const brief = "صمم بنية بصرية عربية واضحة لمؤسسة تعليمية مع مساحة للبرامج ومعلومات التسجيل والتواصل.";
    fireEvent.change(screen.getByPlaceholderText(/هدف التصميم/), { target: { value: brief } });
    fireEvent.click(screen.getByRole("button", { name: "إعداد مسودة للمراجعة" }));
    expect(createDraft).toHaveBeenCalledWith({ collectionKey: "aziz-1", title: "موقع مؤسسة تعليمية", brief });
    expect(document.body.textContent).toMatch(/لا تنشئ وسائط أو أسعارًا أو دفعًا/);
  });

  it("renders reviewed English market-review controls without creating a draft", () => {
    localStorage.setItem("devforge-language", "en");
    render(<LanguageProvider><AzizDesignReviewCenter /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Aziz market review" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Prepare a draft for review" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("There are no drafts yet. The market does not create fictitious items instead.")).toBeTruthy();
    expect(createDraft).not.toHaveBeenCalled();
  });
});
