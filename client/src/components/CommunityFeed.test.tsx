import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CommunityFeed from "./CommunityFeed";
vi.mock("@/lib/trpc", () => ({ trpc: { communityHub: { publicFeed: { useQuery: () => ({ data: [{ id: 1, title: "منشور معتمد", content: "نقاش معتمد متاح للعامة فقط.", createdAt: new Date("2026-01-01"), communityId: 3, communityName: "نادي الاختبار" }], isLoading: false }) } } } }));
describe("CommunityFeed", () => { afterEach(cleanup); it("shows approved discussion without a member identity", () => { render(<CommunityFeed />); expect(screen.getByText("منشور معتمد")).toBeTruthy(); expect(screen.getByText("نادي الاختبار")).toBeTruthy(); expect(screen.getByRole("link", { name: "استكشف المجتمعات" }).getAttribute("href")).toBe("/community"); }); });
