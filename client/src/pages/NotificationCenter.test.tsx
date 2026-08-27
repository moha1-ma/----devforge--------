import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotificationCenter from "./NotificationCenter";

const markRead = vi.fn();
const markAllRead = vi.fn();
const updatePreferences = vi.fn();
const invalidate = vi.fn();
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ notifications: { list: { invalidate }, unreadCount: { invalidate }, preferences: { invalidate } } }),
    notifications: {
      list: { useQuery: () => ({ isLoading: false, data: [{ id: 5, category: "review", title: "مشاركة جديدة", body: "تنتظر مراجعتك داخل المنصة.", link: "/visitor-review", readAt: null, createdAt: new Date("2026-08-27T06:00:00.000Z") }] }) },
      preferences: { useQuery: () => ({ data: { inAppEnabled: true, workspaceEnabled: true, communityEnabled: true, reviewEnabled: true, systemEnabled: true } }) },
      markRead: { useMutation: () => ({ mutate: markRead, isPending: false }) },
      markAllRead: { useMutation: () => ({ mutate: markAllRead, isPending: false }) },
      updatePreferences: { useMutation: () => ({ mutate: updatePreferences, isPending: false }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("NotificationCenter", () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it("shows a recipient-scoped in-site notification and only mutates read state after an explicit action", () => {
    render(<LanguageProvider><NotificationCenter /></LanguageProvider>);
    expect(screen.getByText("مركز الإشعارات")).toBeTruthy();
    expect(screen.getByText("مشاركة جديدة")).toBeTruthy();
    expect(markRead).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "تمييز كمقروء" }));
    expect(markRead).toHaveBeenCalledWith({ notificationId: 5 });
    expect(document.body.textContent).toMatch(/لا بريد، ولا SMS، ولا إشعار جهاز/);
    expect(document.body.textContent).not.toMatch(/Bearer |service_role|127\.0\.0\.1/);
  });

  it("uses reviewed English interface copy without translating private notification content", () => {
    localStorage.setItem("devforge-language", "en");
    render(<LanguageProvider><NotificationCenter /></LanguageProvider>);
    expect(screen.getByText("Notification center")).toBeTruthy();
    expect(screen.getByText("Recent notifications")).toBeTruthy();
    expect(screen.getByText("Inside DevForge only")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark as read" })).toBeTruthy();
    expect(screen.getByText("تنتظر مراجعتك داخل المنصة.")).toBeTruthy();
  });
});
