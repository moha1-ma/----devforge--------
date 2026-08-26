import * as React from "react";

export const MOBILE_BREAKPOINT = 768;

export function isMobileViewport(width: number) {
  return width < MOBILE_BREAKPOINT;
}

export function getEffectiveViewportWidth(input: { innerWidth: number; screenWidth?: number; visualViewportWidth?: number }) {
  const widths = [input.innerWidth, input.screenWidth, input.visualViewportWidth].filter((width): width is number => typeof width === "number" && Number.isFinite(width) && width > 0);
  return Math.min(...widths);
}

function readMobileViewport() {
  return isMobileViewport(getEffectiveViewportWidth({
    innerWidth: window.innerWidth,
    screenWidth: window.screen?.width,
    visualViewportWidth: window.visualViewport?.width,
  }));
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => typeof window === "undefined" ? false : readMobileViewport());

  React.useEffect(() => {
    const onViewportChange = () => setIsMobile(readMobileViewport());
    const visualViewport = window.visualViewport;
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);
    visualViewport?.addEventListener("resize", onViewportChange);
    onViewportChange();
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
      visualViewport?.removeEventListener("resize", onViewportChange);
    };
  }, []);

  return isMobile;
}
