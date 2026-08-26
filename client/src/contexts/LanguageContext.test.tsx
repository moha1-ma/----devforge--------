import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider, LanguageSelector, useLanguage } from "./LanguageContext";

function DirectionProbe() { const { direction, t } = useLanguage(); return <p data-direction={direction}>{t("startJourney")}</p>; }

describe("LanguageContext", () => {
  afterEach(() => { cleanup(); localStorage.clear(); });
  it("keeps Arabic as the default language and direction", () => {
    render(<LanguageProvider><DirectionProbe /></LanguageProvider>);
    expect(screen.getByText("ابدأ مسارك").dataset.direction).toBe("rtl");
  });
  it("persists English selection and switches document direction", () => {
    render(<LanguageProvider><LanguageSelector /><DirectionProbe /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText("اللغة"), { target: { value: "en" } });
    expect(screen.getByText("Start your journey").dataset.direction).toBe("ltr");
    expect(localStorage.getItem("devforge-language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("uses the reviewed English catalog for an additional selected language", () => {
    render(<LanguageProvider><LanguageSelector /><DirectionProbe /></LanguageProvider>);
    fireEvent.change(screen.getByLabelText("اللغة"), { target: { value: "fr" } });
    expect(screen.getByText("Start your journey").dataset.direction).toBe("ltr");
    expect(document.documentElement.lang).toBe("fr");
  });
});
