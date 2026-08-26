import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("@/components/ui/tooltip", () => ({ TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./components/ErrorBoundary", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./contexts/ThemeContext", () => ({ ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("./pages/Home", () => ({ default: () => <div>الصفحة الرئيسية</div> }));
vi.mock("./pages/Workspace", () => ({ default: () => <div>مساحة العمل</div> }));
vi.mock("./pages/StripeLab", () => ({ default: () => <div>مختبر Stripe</div> }));
vi.mock("./pages/CodeWorkspace", () => ({ default: () => <div>مساحة الكود</div> }));
vi.mock("./pages/AiWorkspace", () => ({ default: () => <div>مساحة الذكاء</div> }));
vi.mock("./pages/GithubWorkspace", () => ({ default: () => <div>GitHub</div> }));
vi.mock("./pages/PlansWorkspace", () => ({ default: () => <div>مسارات البناء</div> }));
vi.mock("./pages/ImageStudio", () => ({ default: () => <div>استوديو الصور</div> }));
vi.mock("./pages/WebsiteStudio", () => ({ default: () => <div>منشئ المواقع</div> }));
vi.mock("./pages/DomainGallery", () => ({ default: () => <div>معرض النطاقات</div> }));
vi.mock("./pages/NotFound", () => ({ default: () => <div>غير موجود</div> }));

describe("DevForge hash routing", () => {
  afterEach(() => {
    window.location.hash = "";
    cleanup();
  });

  it("loads the guided plans workspace from the production-safe hash URL", () => {
    window.location.hash = "#/plans";
    render(<App />);

    expect(screen.getByText("مسارات البناء")).toBeTruthy();
  });

  it("loads Website Studio from the production-safe hash URL", () => {
    window.location.hash = "#/website-studio";
    render(<App />);

    expect(screen.getByText("منشئ المواقع")).toBeTruthy();
  });

  it("loads Domain Gallery from the production-safe hash URL", () => {
    window.location.hash = "#/domains";
    render(<App />);

    expect(screen.getByText("معرض النطاقات")).toBeTruthy();
  });
});
