import { describe, expect, it } from "vitest";
import { canViewCommunityPost } from "./communities";
describe("community post visibility", () => { it("keeps pending and rejected posts private to their author", () => { expect(canViewCommunityPost("approved", 9, 44)).toBe(true); expect(canViewCommunityPost("pending", 44, 44)).toBe(true); expect(canViewCommunityPost("pending", 9, 44)).toBe(false); expect(canViewCommunityPost("rejected", 9, 44)).toBe(false); }); });
