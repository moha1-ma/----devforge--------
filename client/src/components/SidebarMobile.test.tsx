import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

describe("mobile sidebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1170 });
    Object.defineProperty(window.screen, "width", { configurable: true, value: 390 });
  });

  afterEach(() => cleanup());

  it("uses a full-screen drawer on iPhone dimensions and keeps the main inset full width", () => {
    const { container } = render(
      <SidebarProvider defaultOpen>
        <Sidebar side="right"><p>محتوى التنقل</p></Sidebar>
        <SidebarInset>محتوى المساعد</SidebarInset>
        <SidebarTrigger aria-label="فتح التنقل للاختبار" />
      </SidebarProvider>
    );

    expect(container.querySelector('[data-slot="sidebar-container"]')).toBeNull();
    expect(container.querySelector('[data-slot="sidebar-inset"]')?.className).toContain("w-full");
    fireEvent.click(screen.getByLabelText("فتح التنقل للاختبار"));
    const mobileDrawer = screen.getByText("محتوى التنقل").closest('[data-slot="sidebar"]');
    expect(mobileDrawer?.className).toContain("w-screen");
    expect(mobileDrawer?.className).toContain("max-w-none");
  });
});
