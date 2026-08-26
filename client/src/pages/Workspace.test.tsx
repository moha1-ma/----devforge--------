import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Workspace from "./Workspace";

const summary = {
  projects: [{ id: 1, name: "بوابة المطورين", key: "DEV", description: null, defaultBranch: "main", health: "on-track" }],
  workItems: [{ id: 10, key: "DEV-1", title: "تحسين المصادقة", status: "backlog", priority: "medium" }],
  pullRequests: [],
  releases: [],
  deployments: [],
  activity: [],
};

const setLocation = vi.fn();
let buildPlans = [{ id: 24, status: "active" }];

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ useLocation: () => ["/work-items", setLocation] }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { summary: { invalidate: vi.fn() } }, projects: { list: { invalidate: vi.fn() } } }),
    workspace: { summary: { useQuery: () => ({ data: summary, isLoading: false }) } },
    buildPlans: { list: { useQuery: () => ({ data: buildPlans }) } },
    projects: { create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    workItems: { create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
  },
}));

describe("Workspace rendered behavior", () => {
  beforeEach(() => { vi.clearAllMocks(); buildPlans = [{ id: 24, status: "active" }]; });
  afterEach(() => { cleanup(); });
  const renderWorkspace = () => render(<LanguageProvider><Workspace /></LanguageProvider>);

  it("renders the board card in its backlog column and filters it from search", () => {
    renderWorkspace();
    expect(screen.getByText("قائمة الانتظار")).toBeTruthy();
    expect(screen.getByText("تحسين المصادقة")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("ابحث في المشاريع، عناصر العمل، أو طلبات السحب..."), { target: { value: "لا شيء" } });
    expect(screen.queryByText("تحسين المصادقة")).toBeNull();
  });

  it("keeps the work-item submit action disabled until project and title are complete", () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "عنصر عمل" }));
    const submit = screen.getByRole("button", { name: "إضافة إلى قائمة الانتظار" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("المشروع"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("العنوان"), { target: { value: "إصلاح الدخول" } });
    expect(submit.disabled).toBe(false);
  });

  it("routes the workspace build action to guided plans", () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: /متابعة خطة البناء/ }));
    expect(setLocation).toHaveBeenCalledWith("/plans?plan=24");
  });

  it("opens the plan-creation workspace when no private plan exists", () => {
    buildPlans = [];
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: /بدء خطة بناء/ }));
    expect(setLocation).toHaveBeenCalledWith("/plans");
  });
});
