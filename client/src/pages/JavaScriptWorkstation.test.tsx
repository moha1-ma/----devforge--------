import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import JavaScriptWorkstation from "./JavaScriptWorkstation";
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/jsSandbox", () => ({ jsSandboxLimits: { maxCharacters: 40_000, maxRuntimeMs: 2_000, maxOutputLines: 120 }, startJavaScriptSandbox: vi.fn(() => ({ stop: vi.fn() })) }));
describe("JavaScriptWorkstation", () => { afterEach(cleanup); it("presents a controlled local execution station rather than an autonomous agent", () => { render(<LanguageProvider><JavaScriptWorkstation /></LanguageProvider>); expect(screen.getByRole("heading", { name: "محطة JavaScript المستقلة" })).toBeTruthy(); expect(screen.getByRole("button", { name: "تشغيل محلي" })).toBeTruthy(); expect(screen.getByRole("button", { name: "إعادة ضبط" })).toBeTruthy(); expect(screen.getByText(/لا تصل إلى الشبكة أو الحسابات أو الأسرار/)).toBeTruthy(); expect(screen.getByLabelText("محرر JavaScript")).toBeTruthy(); }); });
