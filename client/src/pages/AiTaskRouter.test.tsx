import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import AiTaskRouter from "./AiTaskRouter";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("wouter", () => ({ useLocation: () => ["/ai-router", vi.fn()] }));

describe("AI task router page", () => {
  it("keeps routing owner-scoped and does not present it as an automatic executor", () => {
    render(<AiTaskRouter />);
    expect(screen.getByText("خاص بالمالك")).toBeTruthy();
    expect(screen.getByText(/لا ينفذ أو ينشر أو يتصل بحسابات/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /تقسيم للمراجعة/ }).hasAttribute("disabled")).toBe(true);
  });
});
