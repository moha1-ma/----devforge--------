import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import NotFound from "./NotFound";

const toHashHref = (href: string) => `#${href}`;

describe("NotFound", () => {
  afterEach(() => { window.location.hash = ""; cleanup(); });
  it("offers Arabic hash-route recovery for public pages", () => {
    render(<Router hook={useHashLocation} hrefs={toHashHref}><NotFound /></Router>);
    expect(screen.getByText(/تستخدم DevForge روابط آمنة/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "مشاركة زائر" }));
    expect(window.location.hash).toBe("#/share");
  });
});
