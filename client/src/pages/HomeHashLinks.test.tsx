import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Home from "./Home";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, isAuthenticated: false, logout: vi.fn() }) }));
vi.mock("@/components/CommunityFeed", () => ({ default: () => <section>تغذية المجتمع</section> }));

const toHashHref = (href: string) => `#${href}`;

describe("روابط الصفحة الرئيسية", () => {
  afterEach(() => {
    window.location.hash = "";
    cleanup();
  });

  it("توجه دعوة استكشاف الخطط إلى عنوان هاش آمن للنطاق المنشور", () => {
    render(<LanguageProvider><Router hook={useHashLocation} hrefs={toHashHref}><Home /></Router></LanguageProvider>);

    const planLink = screen.getAllByRole("link", { name: /ابدأ مسارك/ })[0];
    expect(planLink.getAttribute("href")).toBe("#/plans");
  });

  it("توجه دعوة منشئ المواقع إلى عنوان هاش آمن للنطاق المنشور", () => {
    render(<LanguageProvider><Router hook={useHashLocation} hrefs={toHashHref}><Home /></Router></LanguageProvider>);

    expect(screen.getByRole("link", { name: /منشئ المواقع/ }).getAttribute("href")).toBe("#/website-studio");
  });

  it("يعرض حالة هندسية منظمة ومدخل مشاركة زوار منفصل", () => {
    render(<LanguageProvider><Router hook={useHashLocation} hrefs={toHashHref}><Home /></Router></LanguageProvider>);

    expect(screen.getByText("مراجعات منظمة")).toBeTruthy();
    expect(screen.getByRole("link", { name: "المجتمعات" }).getAttribute("href")).toBe("#/community");
    expect(screen.getByRole("link", { name: "شارك" }).getAttribute("href")).toBe("#/share");
    expect(screen.getByRole("button", { name: /دخول الزوار/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /فتح مسار المراجعة/ }).getAttribute("href")).toBe("#/plans");
    expect(screen.getByRole("link", { name: /فتح مركز الجودة/ }).getAttribute("href")).toBe("#/developer-center");
  });

  it("يعرض مرجع API المنشور من دون أي مادة اعتماد", () => {
    render(<LanguageProvider><Router hook={useHashLocation} hrefs={toHashHref}><Home /></Router></LanguageProvider>);

    const endpoint = "https://devforgeapp-grp92cnd.manus.space/api/trpc";
    expect(screen.getByText(endpoint)).toBeTruthy();
    expect(screen.getByRole("link", { name: /عرض صفحة API/ }).getAttribute("href")).toBe("#/api");
    expect(document.body.textContent).not.toMatch(/api[_ -]?key|authorization: bearer|sk_[a-z0-9]/i);
  });
});
