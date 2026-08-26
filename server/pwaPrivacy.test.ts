import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

describe("PWA privacy policy", () => {
  it("declares an installable Arabic manifest", () => {
    const manifest = JSON.parse(readFileSync(resolve(projectRoot, "client/public/manifest.webmanifest"), "utf8"));
    expect(manifest.display).toBe("standalone");
    expect(manifest.lang).toBe("ar");
    expect(manifest.icons).toHaveLength(1);
  });

  it("uses an install-only worker that does not cache API or source-file responses", () => {
    const worker = readFileSync(resolve(projectRoot, "client/public/service-worker.js"), "utf8");
    expect(worker).toContain("skipWaiting");
    expect(worker).not.toContain("addEventListener(\"fetch\"");
    expect(worker).not.toContain("caches.open");
  });
});
