import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import GithubWorkspace from "./GithubWorkspace";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ githubWorkspace: { getLink: { invalidate: vi.fn() } } }),
    projects: { list: { useQuery: () => ({ data: [] }) } },
    githubWorkspace: {
      getLink: { useQuery: () => ({ data: null }) },
      selectRepository: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

describe("GithubWorkspace", () => {
  afterEach(cleanup);
  it("keeps repository selection available but blocks connection execution", () => {
    render(<LanguageProvider><GithubWorkspace /></LanguageProvider>);
    expect(screen.getByText(/لا يمنح هذا وصولًا ولا ينفذ استيرادًا أو تصديرًا/)).toBeTruthy();
    expect((screen.getByLabelText("المستودع") as HTMLInputElement).placeholder).toContain("https://github.com");
    expect((screen.getByRole("button", { name: /انتظار مصادقة GitHub الصريحة/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
