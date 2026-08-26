import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import OwnerCodeGate from "./OwnerCodeGate";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
const mutate = vi.fn();
let mutationOptions: { onSuccess?: () => void; onError?: () => void } | undefined;
vi.mock("@/lib/trpc", () => ({
  trpc: { auth: { verifyOwnerCode: { useMutation: (options: { onSuccess?: () => void; onError?: () => void }) => { mutationOptions = options; return { mutate, isPending: false }; } } } },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: toastError } }));

describe("OwnerCodeGate", () => {
  afterEach(() => { cleanup(); sessionStorage.clear(); vi.clearAllMocks(); });

  it("keeps private content gated until an owner code has a valid length", () => {
    render(<LanguageProvider><OwnerCodeGate ownerKey="owner-test"><p>محتوى خاص</p></OwnerCodeGate></LanguageProvider>);
    expect(screen.queryByText("محتوى خاص")).toBeNull();
    expect(screen.getByTestId("owner-gate-shell").className).toContain("w-[100dvw]");
    expect(screen.getByTestId("owner-gate-shell").className).toContain("justify-center");
    expect(screen.getByTestId("owner-gate-shell").className).toContain("fixed");
    expect(screen.getByTestId("owner-gate-shell").className).toContain("w-[100dvw]");
    expect(screen.getByTestId("owner-gate-card").className).toContain("min-w-0");
    const button = screen.getByRole("button", { name: /فتح المساحة الخاصة/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("رمز المالك"), { target: { value: "DF-OWNER-9K7M" } });
    expect(button.disabled).toBe(false);
  });

  it("unlocks child content only after the server mutation reports successful verification", () => {
    render(<LanguageProvider><OwnerCodeGate ownerKey="owner-test"><p>محتوى خاص</p></OwnerCodeGate></LanguageProvider>);
    expect(screen.queryByText("محتوى خاص")).toBeNull();
    act(() => { mutationOptions?.onSuccess?.(); });
    expect(screen.getByText("محتوى خاص")).toBeTruthy();
    expect(sessionStorage.getItem("devforge-owner-gate-v1:owner-test")).toBe("approved");
  });

  it("does not imply an OAuth identity rejection when the server rejects a code", () => {
    render(<LanguageProvider><OwnerCodeGate ownerKey="owner-test"><p>محتوى خاص</p></OwnerCodeGate></LanguageProvider>);
    act(() => { mutationOptions?.onError?.(); });
    expect(toastError).toHaveBeenCalledWith("تعذّر التحقق من رمز المالك؛ راجع كتابته ثم أعد المحاولة");
  });
});
