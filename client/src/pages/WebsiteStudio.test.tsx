import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WebsiteStudio from "./WebsiteStudio";

const setLocation = vi.fn();
const create = vi.fn();
const refetch = vi.fn();
const addSupabaseStarter = vi.fn();
let buildsQuery: any = { data: [], isLoading: false, isError: false, refetch };
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ useLocation: () => ["/website-studio", setLocation] }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ websiteBuilder: { list: { invalidate: vi.fn() } }, projects: { list: { invalidate: vi.fn() } }, workspace: { summary: { invalidate: vi.fn() } }, sourceFiles: { list: { invalidate: vi.fn() } } }), websiteBuilder: { list: { useQuery: () => buildsQuery }, create: { useMutation: () => ({ mutate: create, isPending: false }) }, prepareDomain: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, addSupabaseStarter: { useMutation: () => ({ mutate: addSupabaseStarter, isPending: false }) } } } }));

describe("WebsiteStudio", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); buildsQuery = { data: [], isLoading: false, isError: false, refetch }; });
  it("keeps creation disabled until the structured website brief is sufficient", () => {
    render(<WebsiteStudio />);
    const button = screen.getByRole("button", { name: /إنشاء موقع خاص قابل للتحرير/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("اسم الموقع"), { target: { value: "استوديو أطلس" } });
    fireEvent.change(screen.getByLabelText("نوع النشاط"), { target: { value: "استشارات" } });
    fireEvent.change(screen.getByLabelText("ماذا يجب أن يفهم الزائر؟"), { target: { value: "نساعد فرق المنتجات على تحسين مواقعهم وإطلاقها بصورة منظمة وواضحة." } });
    expect(button.disabled).toBe(false);
  });

  it("makes the domain boundary explicit without showing an automatic purchase action", () => {
    render(<WebsiteStudio />);
    expect(screen.getByText(/لا نتحقق من التوفر ولا نسجل النطاق تلقائيًا/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /شراء نطاق/ })).toBeNull();
  });

  it("shows a recoverable error when the private website list cannot load", () => {
    buildsQuery = { data: [], isLoading: false, isError: true, refetch };
    render(<WebsiteStudio />);
    expect(screen.getByRole("alert").textContent).toContain("تعذر تحميل مواقعك الخاصة");
    fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("offers a mobile Supabase starter only for an existing private website", () => {
    buildsQuery = { data: [{ id: 42, projectId: 18, title: "موقع أطلس", businessType: "استشارات", visualPreset: "studio", domainCandidate: null, domainStatus: "not-requested", supabaseStarterStatus: "not-prepared" }], isLoading: false, isError: false, refetch };
    render(<WebsiteStudio />);
    expect(screen.getByText("إعداد Supabase من الهاتف")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "إضافة حزمة Supabase للموقع" }));
    expect(addSupabaseStarter).toHaveBeenCalledWith({ websiteBuildId: 42 });
    expect(screen.getByText(/لا تستخدم/)).toBeTruthy();
  });
});
