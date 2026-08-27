import { describe, expect, it, vi } from "vitest";
import { PWA_RELEASE, activateWaitingWorker, buildServiceWorkerUrl } from "./serviceWorkerUpdate";

describe("PWA update lifecycle", () => {
  it("versions the service-worker script URL so new releases can replace stale workers", () => {
    expect(buildServiceWorkerUrl()).toBe(`/service-worker.js?release=${PWA_RELEASE}`);
  });
  it("activates a waiting worker only after an explicit client action", () => {
    const postMessage = vi.fn();
    expect(activateWaitingWorker({ postMessage })).toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(activateWaitingWorker(null)).toBe(false);
  });
});
