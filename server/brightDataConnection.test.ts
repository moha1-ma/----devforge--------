import { describe, expect, it } from "vitest";

describe.skipIf(process.env.BRIGHT_DATA_LIVE_TEST !== "true")("Bright Data search connection", () => {
  it("authenticates a read-only Google SERP request with the stored project credentials", async () => {
    const apiKey = process.env.BRIGHT_DATA_API_KEY;
    const zone = process.env.BRIGHT_DATA_SERP_ZONE;
    expect(apiKey).toBeTruthy();
    expect(zone).toBeTruthy();

    const response = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ zone, url: "https://www.google.com/search?q=DevForge&hl=en&gl=us", format: "raw" }),
    });
    expect(response.ok).toBe(true);
    await response.body?.cancel();
  }, 30_000);
});
