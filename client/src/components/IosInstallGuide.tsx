import { Button } from "@/components/ui/button";
import { shouldShowIosInstallGuide } from "@/lib/pwaInstall";
import { Check, Plus, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const displayModeStandalone = typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  return displayModeStandalone || navigatorWithStandalone.standalone === true;
}

export default function IosInstallGuide() {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setShowGuide(shouldShowIosInstallGuide(navigator.userAgent, isStandaloneMode()));
  }, []);

  if (!showGuide) return null;

  return (
    <aside className="mx-auto mt-5 flex w-full max-w-3xl items-start gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-right shadow-lg shadow-cyan-950/15" aria-label="تثبيت DevForge على iPhone">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-300 text-slate-950"><Share2 className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-cyan-100">استخدم DevForge كتطبيق مستقل على iPhone</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">من Safari: اضغط <span className="inline-flex items-center gap-1 font-semibold text-white"><Share2 className="h-3.5 w-3.5" /> مشاركة</span> ثم <span className="inline-flex items-center gap-1 font-semibold text-white"><Plus className="h-3.5 w-3.5" /> إضافة إلى الشاشة الرئيسية</span>. سيظهر رمز DevForge ويفتح دون شريط المتصفح.</p>
      </div>
      <Button type="button" variant="ghost" size="icon" className="shrink-0 text-cyan-100 hover:bg-white/10 hover:text-white" aria-label="إخفاء إرشاد التثبيت" onClick={() => setShowGuide(false)}><Check className="h-4 w-4" /></Button>
    </aside>
  );
}
