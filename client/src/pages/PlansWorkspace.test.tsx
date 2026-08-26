import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import PlansWorkspace from "./PlansWorkspace";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useLocation: () => ["/plans", vi.fn()],
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ buildPlans: { list: { invalidate: vi.fn() }, get: { invalidate: vi.fn() } } }),
    buildPlans: {
      list: { useQuery: () => ({ data: [] }) },
      get: { useQuery: () => ({ data: undefined }) },
      create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateStep: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

describe("PlansWorkspace", () => {
  afterEach(cleanup);
  it("offers clear start paths for website, mobile app, API, and product work", () => {
    render(<LanguageProvider><PlansWorkspace /></LanguageProvider>);
    expect(screen.getByText("موقع ويب احترافي")).toBeTruthy();
    expect(screen.getByText("تطبيق جوال")).toBeTruthy();
    expect(screen.getByText("واجهة API وخدمة خلفية")).toBeTruthy();
    expect(screen.getByText("منتج برمجي متكامل")).toBeTruthy();
  });
});
