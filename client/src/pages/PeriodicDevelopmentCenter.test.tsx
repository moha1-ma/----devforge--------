import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PeriodicDevelopmentCenter from "./PeriodicDevelopmentCenter";
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ direction: "rtl" }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ periodicDevelopment: { status: { invalidate: vi.fn() }, drafts: { invalidate: vi.fn() } } }), periodicDevelopment: { status: { useQuery: () => ({ data: null }) }, drafts: { useQuery: () => ({ data: [], isLoading: false }) }, configure: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, pause: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, reviewDraft: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
describe("PeriodicDevelopmentCenter", () => { afterEach(cleanup); it("shows a review-only schedule and manual activation state", () => { render(<PeriodicDevelopmentCenter />); expect(screen.getByRole("heading", { name: "محطة التطوير الدورية" })).toBeTruthy(); expect(screen.getByRole("button", { name: "تفعيل المسودات الدورية" })).toBeTruthy(); expect(screen.getByText(/لا تقرأ شفرتك الخاصة أو أسرارك/)).toBeTruthy(); expect(screen.getByText(/لا تقرر هذه اللوحة أو تطبق تعديلات/)).toBeTruthy(); }); });
