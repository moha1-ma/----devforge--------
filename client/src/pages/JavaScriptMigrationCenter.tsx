import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowRightLeft, Box, Database, KeyRound, ServerCog, ShieldCheck, UploadCloud } from "lucide-react";
import React from "react";
import { toast } from "sonner";

const portabilityContracts = [
  { icon: ServerCog, title: "محرك JavaScript", value: "Node.js + TypeScript", description: "الخادم الحالي مبني لمسار JavaScript منظم؛ اختيار بيئة تشغيل مستقلة يبقى قرار المالك." },
  { icon: ArrowRightLeft, title: "عقد API", value: "/api/trpc", description: "بوابة API مشتقة من أصل الموقع النشط. لا تُعرض عناوين داخلية أو مفاتيح أو رموز جلسة." },
  { icon: Database, title: "البيانات والملفات", value: "خطة ترحيل مطلوبة", description: "يتطلب أي نقل نسخة احتياطية، وصلاحيات، وخطة مراجعة ينفذها المالك في بيئته." },
  { icon: KeyRound, title: "المصادقة والأسرار", value: "إعداد مستقل مطلوب", description: "تحتاج البيئة الجديدة مزود هوية وخزينة أسرار يختارهما المالك. لا تنتقل الجلسات أو المفاتيح من هذه الصفحة." },
] as const;

export default function JavaScriptMigrationCenter() {
  const { direction } = useLanguage();
  const review = trpc.integrationCenter.request.useMutation({
    onSuccess: () => toast.success("سُجلت مراجعة انتقال JavaScript فقط. لم يتغير أي تشغيل أو بيانات."),
    onError: error => toast.error(error.message),
  });
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return <DashboardLayout><section dir={direction} className="mx-auto max-w-6xl space-y-5"><header className="relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-l from-violet-300/12 via-slate-950 to-cyan-400/10 p-6 sm:p-8"><div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-300/10 blur-3xl" /><Badge className="relative border border-violet-300/25 bg-violet-300/10 text-violet-100"><ServerCog className="ml-1 h-3.5 w-3.5" />خاص بالمالك</Badge><h1 className="relative mt-4 text-2xl font-bold text-white sm:text-3xl">جاهزية انتقال محرك JavaScript</h1><p className="relative mt-2 max-w-3xl leading-8 text-slate-300">احتفظ بتحكمك في DevForge عبر خطة انتقال صريحة إلى بيئة JavaScript تختارها. يعرض هذا المركز العقود والاعتمادات فقط؛ لا يفصل المنصة ولا ينقلها.</p></header>
    <Card className="border-violet-300/20 bg-violet-300/[0.045] text-violet-50"><CardHeader><CardTitle className="flex items-center gap-2 text-violet-100"><UploadCloud className="h-5 w-5" />طلب مراجعة انتقال</CardTitle><CardDescription className="leading-7 text-violet-100/75">يسجل الطلب رغبتك في مراجعة الانتقال لاحقًا. لا ينشئ حساب استضافة أو نطاقًا أو قاعدة بيانات، ولا يغير OAuth أو التخزين أو DNS أو GitHub.</CardDescription></CardHeader><CardContent><Button type="button" onClick={() => review.mutate({ providerKey: "devforge-javascript-portability" })} disabled={review.isPending} className="bg-violet-300 text-slate-950 hover:bg-violet-200"><ShieldCheck className="ml-2 h-4 w-4" />{review.isPending ? "يجري تسجيل المراجعة…" : "سجل مراجعة انتقال JavaScript"}</Button></CardContent></Card>
    <section aria-label="عقود جاهزية JavaScript" className="grid gap-4 md:grid-cols-2">{portabilityContracts.map(item => <Card key={item.title} className="border-white/10 bg-slate-950/60 text-white"><CardHeader><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><item.icon className="h-5 w-5" /></div><div><CardTitle>{item.title}</CardTitle><CardDescription className="mt-2 text-violet-100/75">{item.value}</CardDescription></div></div></CardHeader><CardContent className="text-sm leading-7 text-slate-400">{item.description}</CardContent></Card>)}</section>
    <section className="grid gap-4 md:grid-cols-2"><Card className="border-cyan-300/15 bg-cyan-300/[0.035] text-white"><CardHeader><CardTitle className="flex items-center gap-2 text-cyan-100"><Box className="h-5 w-5" />العقد النشط</CardTitle></CardHeader><CardContent><code dir="ltr" className="block overflow-x-auto rounded-xl border border-cyan-300/15 bg-black/30 p-3 text-left text-xs text-cyan-100">{origin}/api/trpc</code><p className="mt-3 text-sm leading-7 text-slate-400">يبقى هذا عنوان الخدمة الحالية فقط. يُعاد ضبطه في بيئتك المستقلة عند اختيار نطاق واستضافة خاصين بك.</p></CardContent></Card><Card className="border-amber-300/15 bg-amber-300/[0.045] text-amber-50"><CardHeader><CardTitle className="flex items-center gap-2 text-amber-100"><ShieldCheck className="h-5 w-5" />ما لا تفعله الصفحة</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-amber-100/75">لا تصدر بيانات، ولا تنقل أسرارًا أو مستخدمين، ولا تنشئ مزودًا خارجيًا، ولا تغير الاستضافة الحالية. لا يبدأ التنفيذ إلا بعد اختيار المالك لبيئته وتأكيد كل خطوة انتقال منفصلة.</CardContent></Card></section>
  </section></DashboardLayout>;
}
