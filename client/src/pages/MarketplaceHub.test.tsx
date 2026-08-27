import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import MarketplaceHub from "./MarketplaceHub";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ marketplace: { publicStores: { invalidate: vi.fn() }, mine: { invalidate: vi.fn() } } }), marketplace: { publicStores: { useQuery: () => ({ data: [], isLoading: false }) }, mine: { useQuery: () => ({ data: [], isLoading: false }) }, requestStore: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));

describe("MarketplaceHub", () => { afterEach(cleanup); it("shows a genuine empty marketplace and does not display fabricated shops, reviews, or payments", () => { render(<LanguageProvider><MarketplaceHub /></LanguageProvider>); expect(screen.getByRole("heading", { name: "السوق ينتظر أول متجر حقيقي" })).toBeTruthy(); expect(screen.getByText(/لا توجد أمثلة وهمية/)).toBeTruthy(); expect(screen.getByText("لا مدفوعات")).toBeTruthy(); expect(screen.getByRole("link", { name: /سوق عزوز للتصاميم/ })).toBeTruthy(); expect(screen.getByRole("button", { name: "تسجيل الدخول والمتابعة" })).toBeTruthy(); expect(screen.queryByText("★★★★★")).toBeNull(); expect(screen.queryByText(/مراجعة عميل/)).toBeNull(); }); });
