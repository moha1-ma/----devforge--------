import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Home from "./Home";

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
    expect(screen.getByRole("link", { name: "شارك" }).getAttribute("href")).toBe("#/share");
  });
});
