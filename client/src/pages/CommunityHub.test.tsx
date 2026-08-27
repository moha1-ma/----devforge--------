import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CommunityHub from "./CommunityHub";
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: () => ({ direction: "rtl" }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({}), communityHub: { myProfile: { useQuery: () => ({}) }, memberSearch: { useQuery: () => ({}) }, communities: { useQuery: () => ({}) }, myMemberships: { useQuery: () => ({}) }, posts: { useQuery: () => ({}) }, saveProfile: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, createCommunity: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, requestMembership: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, createPost: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, report: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
describe("CommunityHub", () => { afterEach(() => cleanup()); it("requires visitor sign-in and discloses opt-in discovery", () => { render(<CommunityHub />); expect(screen.getByRole("heading", { name: "سجّل الدخول للبحث والانضمام" })).toBeTruthy(); expect(screen.getByText(/اختيارية ومخفية افتراضيًا/)).toBeTruthy(); expect(screen.getByRole("button", { name: "دخول الزوار" })).toBeTruthy(); }); });
