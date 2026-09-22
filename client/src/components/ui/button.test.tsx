import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  afterEach(cleanup);

  it("prevents a disabled slotted link from activating", () => {
    const onClick = vi.fn();
    render(<Button asChild disabled><a href="/danger" onClick={onClick}>Disabled action</a></Button>);

    const link = screen.getByRole("link", { name: "Disabled action" });
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.getAttribute("tabindex")).toBe("-1");
    expect(fireEvent.click(link)).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });
});
