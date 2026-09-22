import { startGoogleLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

// Sign-in button that checks whether Google OAuth is configured on the
// server before enabling itself, so users are not shown a login option
// that would fail.
export default function GoogleSignInButton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/google/status", {
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(response =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("status unavailable"))
      )
      .then((status: { enabled?: unknown }) =>
        setEnabled(status.enabled === true)
      )
      .catch(error => {
        if (error instanceof Error && error.name !== "AbortError")
          setEnabled(false);
      });
    return () => controller.abort();
  }, []);

  const label =
    enabled === null
      ? t("googleChecking")
      : enabled
        ? t("continueWithGoogle")
        : t("googleUnavailable");
  return (
    <Button
      type="button"
      variant="outline"
      disabled={enabled !== true}
      onClick={startGoogleLogin}
      title={enabled === false ? t("googleUnavailable") : undefined}
      className={cn(
        "border-white/12 bg-white/[0.045] font-semibold text-white hover:bg-white/[0.09] hover:text-white",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-6 w-6 place-items-center rounded-full bg-white font-sans text-sm font-black text-slate-900"
      >
        G
      </span>
      <span>{compact && enabled === true ? "Google" : label}</span>
    </Button>
  );
}
