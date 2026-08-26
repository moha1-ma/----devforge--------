import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VisitorReviewCenter from "./VisitorReviewCenter";

const moderate = vi.fn();
let submissionsQuery: any = { data: [], isLoading: false, error: null };
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ direction: "rtl" }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ visitorSubmissions: { listForOwner: { invalidate: vi.fn() } } }), visitorSubmissions: { listForOwner: { useQuery: () => submissionsQuery }, attachmentForOwner: { useQuery: () => ({ data: null, isLoading: false }) }, moderate: { useMutation: () => ({ mutate: moderate, isPending: false }) } } } }));

describe("VisitorReviewCenter", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); submissionsQuery = { data: [], isLoading: false, error: null }; });
  it("shows pending content only in the owner review queue and sends an explicit moderation action", () => {
    submissionsQuery = { data: [{ id: 8, visitorAlias: "زائر", category: "code", title: "مكتبة بايثون", content: "مشاركة كود قصيرة ومعلّقة للمراجعة.", status: "pending", attachments: [] }], isLoading: false, error: null };
    render(<VisitorReviewCenter />);
    expect(screen.getByText("مكتبة بايثون")).toBeTruthy();
    expect(screen.getByText(/لا يظهر للجمهور/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /اعتماد/ }));
    expect(moderate).toHaveBeenCalledWith({ submissionId: 8, status: "approved" });
  });
});
