import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import React, { ReactNode, useState } from "react";
import { toast } from "sonner";

const SESSION_KEY = "devforge-owner-gate-v1";

export default function OwnerCodeGate({ children, ownerKey }: { children: ReactNode; ownerKey: string }) {
  const { direction, t } = useLanguage();
  const [code, setCode] = useState("");
  const sessionKey = `${SESSION_KEY}:${ownerKey}`;
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(sessionKey) === "approved");
  const verify = trpc.auth.verifyOwnerCode.useMutation({
    onSuccess: () => { sessionStorage.setItem(sessionKey, "approved"); setUnlocked(true); toast.success(t("ownerUnlocked")); },
    onError: () => toast.error(t("ownerError")),
  });
  if (unlocked) return <>{children}</>;
  return <main data-testid="owner-gate-shell" dir={direction} className="dev-shell fixed inset-0 z-50 flex min-h-[100dvh] w-[100dvw] max-w-[100dvw] items-center justify-center overflow-x-hidden px-5"><section data-testid="owner-gate-card" className="w-full min-w-0 max-w-md rounded-[2rem] border border-cyan-300/15 bg-slate-950/75 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><LockKeyhole className="h-7 w-7" /></div><h1 className="mt-6 text-2xl font-bold text-white">{t("ownerLock")}</h1><p className="mt-3 leading-7 text-slate-400">{t("ownerDesc")}</p><form onSubmit={event => { event.preventDefault(); verify.mutate({ code }); }} className="mt-7 space-y-3"><label className="sr-only" htmlFor="owner-code">{t("ownerCode")}</label><Input id="owner-code" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} placeholder="DF-OWNER-••••-••••-••••" className="h-12 border-white/10 bg-white/5 text-center font-mono text-white" required /><Button type="submit" disabled={verify.isPending || code.trim().length < 12} className="h-12 w-full bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><KeyRound className="ml-2 h-4 w-4" />{verify.isPending ? t("verifying") : t("unlockSpace")}</Button></form><p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-600"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> {t("ownerSessionNote")}</p></section></main>;
}
