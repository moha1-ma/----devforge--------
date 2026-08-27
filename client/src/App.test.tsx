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
vi.mock("./pages/DeveloperCenter", () => ({ default: () => <div>مركز المطور الذكي</div> }));
vi.mock("./pages/CommunityHub", () => ({ default: () => <div>مجتمع DevForge</div> }));
vi.mock("./pages/CommunityReviewCenter", () => ({ default: () => <div>مراجعة مجتمع DevForge</div> }));
vi.mock("./pages/JavaScriptWorkstation", () => ({ default: () => <div>محطة JavaScript</div> }));
vi.mock("./pages/PeriodicDevelopmentCenter", () => ({ default: () => <div>مسودات دورية</div> }));
vi.mock("./pages/ApiReferencePage", () => ({ default: () => <div>مرجع API عام</div> }));
vi.mock("./pages/GlobalResearchHub", () => ({ default: () => <div>مركز بحث عالمي</div> }));
vi.mock("./pages/MarketplaceHub", () => ({ default: () => <div>سوق المتاجر</div> }));
vi.mock("./pages/MarketplaceReviewCenter", () => ({ default: () => <div>مراجعة السوق</div> }));
vi.mock("./pages/AiTaskRouter", () => ({ default: () => <div>موجّه الذكاء الصناعي</div> }));
vi.mock("./pages/TechnicalPartnerHub", () => ({ default: () => <div>الشركاء التقنيون</div> }));
vi.mock("./pages/ContinuityCenter", () => ({ default: () => <div>مركز الاستمرارية</div> }));
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

  it("loads the private Developer Center from its hash URL", () => {
    window.location.hash = "#/developer-center";
    render(<App />);

    expect(screen.getByText("مركز المطور الذكي")).toBeTruthy();
  });

  it("loads community discovery and owner review from production-safe hash URLs", () => {
    window.location.hash = "#/community";
    const { unmount } = render(<App />);
    expect(screen.getByText("مجتمع DevForge")).toBeTruthy();
    unmount();
    window.location.hash = "#/community-review";
    render(<App />);
    expect(screen.getByText("مراجعة مجتمع DevForge")).toBeTruthy();
  });

  it("loads the isolated JavaScript workstation from its hash URL", () => {
    window.location.hash = "#/javascript-lab";
    render(<App />);
    expect(screen.getByText("محطة JavaScript")).toBeTruthy();
  });

  it("loads the periodic development center from its hash URL", () => {
    window.location.hash = "#/periodic-development";
    render(<App />);
    expect(screen.getByText("مسودات دورية")).toBeTruthy();
  });

  it("loads the public API reference from its stable hash URL", () => {
    window.location.hash = "#/api";
    render(<App />);
    expect(screen.getByText("مرجع API عام")).toBeTruthy();
  });

  it("loads the owner global research hub from its hash URL", () => {
    window.location.hash = "#/global-research";
    render(<App />);
    expect(screen.getByText("مركز بحث عالمي")).toBeTruthy();
  });

  it("loads the empty marketplace and its owner review route from hash URLs", () => {
    window.location.hash = "#/marketplace";
    const { unmount } = render(<App />);
    expect(screen.getByText("سوق المتاجر")).toBeTruthy();
    unmount();
    window.location.hash = "#/marketplace-review";
    render(<App />);
    expect(screen.getByText("مراجعة السوق")).toBeTruthy();
  });

  it("loads the owner AI task router from its hash URL", () => {
    window.location.hash = "#/ai-router";
    render(<App />);

    expect(screen.getByText("موجّه الذكاء الصناعي")).toBeTruthy();
  });

  it("loads the owner partner and continuity routes from safe hash URLs", () => {
    window.location.hash = "#/partners";
    const { unmount } = render(<App />);
    expect(screen.getByText("الشركاء التقنيون")).toBeTruthy();
    unmount();
    window.location.hash = "#/continuity";
    render(<App />);
    expect(screen.getByText("مركز الاستمرارية")).toBeTruthy();
  });
});
