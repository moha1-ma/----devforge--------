import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VisitorMessagesPage from "./VisitorMessagesPage";

const mocks = vi.hoisted(() => ({ startLogin: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, isAuthenticated: false }) }));
vi.mock("@/const", () => ({ startLogin: mocks.startLogin }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ direction: "rtl" }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({}), visitorConversations: { mine: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) }, start: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, send: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));

describe("VisitorMessagesPage", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });
  it("provides an explicit visitor sign-in action before showing private conversations", () => {
    render(<VisitorMessagesPage />);
    expect(screen.getByText(/لا تظهر رسائلك لبقية الزوار/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "دخول الزوار" }));
    expect(mocks.startLogin).toHaveBeenCalledTimes(1);
  });
});
