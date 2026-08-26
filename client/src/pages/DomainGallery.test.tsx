import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DomainGallery from "./DomainGallery";

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ domainGallery: { list: { invalidate: vi.fn() } } }), domainGallery: { list: { useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }) }, seed: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) }, updateStatus: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));

describe("DomainGallery", () => {
  afterEach(cleanup);
  it("uses transparent proposed-name language instead of a misleading sale claim", () => {
    render(<DomainGallery />);
    expect(screen.getByText(/لا يعني ظهور أي اسم أنه متاح أو مسجل أو معروض للبيع/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /تهيئة 20 اسمًا مقترحًا/ })).toBeTruthy();
  });
});
