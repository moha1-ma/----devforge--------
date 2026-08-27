import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AzizMarketHub from "./AzizMarketHub";

vi.mock("@/lib/trpc", () => ({ trpc: { azizMarket: { collections: { useQuery: () => ({ data: [
  { key: "aziz-1", name: "عزوز 1", description: "قوالب مواقع ويب قابلة للمراجعة قبل النشر.", capacity: 180, approvedCount: 0 },
  { key: "aziz-2", name: "عزوز 2", description: "تصاميم بطاقات أعمال قابلة للمراجعة قبل النشر.", capacity: 1500, approvedCount: 0 },
  { key: "aziz-3", name: "عزوز 3", description: "تصاميم أغلفة كتب قابلة للمراجعة قبل النشر.", capacity: 5000, approvedCount: 0 },
], isLoading: false }) }, publicAssets: { useQuery: () => ({ data: [], isLoading: false }) } } } }));

describe("AzizMarketHub", () => {
  afterEach(() => { cleanup(); localStorage.clear(); });
  it("shows the three capacity targets with zero approved assets instead of fabricated catalog items", () => {
    render(<LanguageProvider><AzizMarketHub /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "سوق تصميمات عزوز" })).toBeTruthy();
    expect(screen.getByText("عزوز 1")).toBeTruthy();
    expect(screen.getByText("عزوز 2")).toBeTruthy();
    expect(screen.getByText("عزوز 3")).toBeTruthy();
    expect(screen.getByText("0 / 180")).toBeTruthy();
    expect(screen.getByText("0 / 1500")).toBeTruthy();
    expect(screen.getByText("0 / 5000")).toBeTruthy();
    expect(screen.getByText(/السوق ينتظر أول أصل تصميم حقيقي/)).toBeTruthy();
    expect(document.body.textContent).toMatch(/لا أسعار ولا مدفوعات/);
    expect(document.body.textContent).not.toMatch(/★★★★★|شراء الآن|السعر/);
  });

  it("filters approved assets only when a collection is explicitly selected", () => {
    render(<LanguageProvider><AzizMarketHub /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: /عزوز 2/ }));
    expect(screen.getByRole("button", { name: "إظهار الكل" })).toBeTruthy();
  });

  it("renders the reviewed English empty market with real zero counts and no payment", () => {
    localStorage.setItem("devforge-language", "en");
    render(<LanguageProvider><AzizMarketHub /></LanguageProvider>);
    expect(screen.getByRole("heading", { name: "Aziz design market" })).toBeTruthy();
    expect(screen.getByText("Aziz 1")).toBeTruthy();
    expect(screen.getByText("0 / 5000")).toBeTruthy();
    expect(screen.getByText("The market is awaiting its first genuine design asset")).toBeTruthy();
    expect(document.body.textContent).toContain("No prices or payments");
    expect(document.body.textContent).not.toMatch(/Buy now|Price|★★★★★/);
  });
});
