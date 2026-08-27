import { describe, expect, it } from "vitest";
import { getPeriodicDevelopmentCron } from "./periodicDevelopment";
describe("periodic development scheduling", () => { it("uses six-field UTC schedules at a safe bounded cadence", () => { expect(getPeriodicDevelopmentCron("hourly")).toBe("0 0 * * * *"); expect(getPeriodicDevelopmentCron("every-6-hours")).toBe("0 0 */6 * * *"); }); });
