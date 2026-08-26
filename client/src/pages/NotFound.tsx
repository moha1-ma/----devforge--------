import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Route, Share2 } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return <main dir="rtl" className="dev-shell grid min-h-screen place-items-center px-5"><section className="w-full max-w-xl rounded-[2rem] border border-cyan-300/15 bg-slate-950/75 p-7 text-center shadow-2xl"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-slate-950"><Route className="h-7 w-7" /></div><p className="command-label mt-6">route / recovery</p><h1 className="mt-3 text-3xl font-black text-white">المسار غير متاح</h1><p className="mt-4 leading-8 text-slate-400">تستخدم DevForge روابط آمنة بصيغة <code className="rounded bg-white/5 px-2 py-1 text-cyan-200">#/المسار</code>. افتح الوجهة من الأزرار أدناه أو ارجع إلى لوحة البداية.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button onClick={() => setLocation("/")} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Home className="ml-2 h-4 w-4" />الرئيسية</Button><Button variant="outline" onClick={() => setLocation("/share")} className="border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"><Share2 className="ml-2 h-4 w-4" />مشاركة زائر</Button></div><p className="mt-6 flex justify-center gap-2 text-xs text-slate-500"><ArrowRight className="h-3.5 w-3.5 text-cyan-300" />إذا فتحت رابطًا محفوظًا قديمًا، استبدل الجزء بعد النطاق بـ <span dir="ltr">/#/</span>.</p></section></main>;
}
