import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, CreditCard, ExternalLink, FileCode2, ShieldAlert, TerminalSquare, Webhook } from "lucide-react";
import { toast } from "sonner";

const scenarios = [
  { id: "customer", title: "إنشاء عميل تجريبي", method: "POST", path: "/v1/customers", outcome: "عميل Sandbox قابل للفحص في Dashboard" },
  { id: "intent", title: "إنشاء Payment Intent", method: "POST", path: "/v1/payment_intents", outcome: "حالة requires_payment_method بدون تأكيد عملية دفع" },
  { id: "checkout", title: "بدء Checkout Session", method: "POST", path: "/v1/checkout/sessions", outcome: "جلسة اختبار لواجهة Stripe المستضافة أو المضمّنة" },
  { id: "webhook", title: "اختبار Webhook", method: "CLI", path: "stripe trigger payment_intent.succeeded", outcome: "حدث اختبار موقّع للتحقق من المعالج" },
];

export default function StripeLab() {
  const copyCommand = async () => {
    await navigator.clipboard.writeText("node scripts/stripe-sandbox-demo.mjs");
    toast.success("تم نسخ أمر التشغيل");
  };

  return (
    <DashboardLayout>
      <section dir="rtl" className="space-y-7">
        <div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-l from-cyan-300/10 to-violet-400/10 p-7 md:p-9">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"><div><Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"><CreditCard className="ml-1 h-3.5 w-3.5" /> Stripe Sandbox Lab</Badge><h1 className="mt-5 text-3xl font-bold text-white">استكشف Stripe دون المساس بالمدفوعات الحقيقية.</h1><p className="mt-3 max-w-2xl leading-8 text-slate-300">توثيق وتجربة تحكمية لإنشاء كائنات Stripe التجريبية وفحصها. النص البرمجي يرفض مفاتيح الإنتاج، ولا يؤكد أي وسيلة دفع.</p></div><div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"><span className="flex items-center gap-2 font-bold"><ShieldAlert className="h-4 w-4" /> مفاتيح الاختبار غير مهيأة</span><p className="mt-1 max-w-xs text-xs leading-5 text-amber-200/70">أضف مفتاح sk_test_ من إعدادات الدفع لتشغيل الطلبات الفعلية.</p></div></div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]"><article className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><TerminalSquare className="h-5 w-5" /></span><div><h2 className="font-bold text-white">نص الاختبار الآمن</h2><p className="mt-1 text-sm text-slate-500">ينشئ Customer وPaymentIntent تجريبيين فقط.</p></div></div><pre dir="ltr" className="mt-6 overflow-x-auto rounded-2xl border border-white/8 bg-slate-950 p-4 text-left font-mono text-xs leading-6 text-cyan-100"><code>{`cd /home/ubuntu/devforge-platform\nnode scripts/stripe-sandbox-demo.mjs`}</code></pre><div className="mt-5 flex flex-wrap gap-3"><Button onClick={copyCommand} className="bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200"><Copy className="ml-2 h-4 w-4" /> نسخ الأمر</Button><a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noreferrer"><Button variant="outline" className="border-white/12 bg-white/[0.03] text-white hover:bg-white/8 hover:text-white">مفاتيح Sandbox <ExternalLink className="mr-2 h-4 w-4" /></Button></a></div></article><article className="rounded-3xl border border-white/8 bg-white/[0.025] p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-300/10 text-violet-200"><FileCode2 className="h-5 w-5" /></span><div><h2 className="font-bold text-white">نتيجة متوقعة</h2><p className="mt-1 text-sm text-slate-500">الكائن الناتج يظل في Stripe Sandbox فقط.</p></div></div><pre dir="ltr" className="mt-6 overflow-x-auto rounded-2xl border border-white/8 bg-slate-950 p-4 text-left font-mono text-xs leading-6 text-emerald-100"><code>{`{\n  "mode": "sandbox",\n  "paymentIntent": "pi_…",\n  "status": "requires_payment_method",\n  "amount": 1099,\n  "currency": "usd"\n}`}</code></pre><p className="mt-5 rounded-xl bg-white/[0.035] p-3 text-sm leading-7 text-slate-400">لا يطبع النص المفتاح السري ولا client_secret، ولا يستدعي تأكيد بطاقة أو استردادًا.</p></article></div>

        <section className="grid gap-4 md:grid-cols-2">{scenarios.map(scenario => <article key={scenario.id} className="rounded-3xl border border-white/8 bg-white/[0.025] p-5"><div className="flex items-start justify-between"><span className={`rounded-lg px-2 py-1 font-mono text-xs ${scenario.method === "CLI" ? "bg-violet-300/10 text-violet-200" : "bg-cyan-300/10 text-cyan-200"}`}>{scenario.method}</span><CheckCircle2 className="h-5 w-5 text-slate-600" /></div><h2 className="mt-7 font-bold text-white">{scenario.title}</h2><p className="mt-2 font-mono text-xs text-slate-500">{scenario.path}</p><p className="mt-5 text-sm leading-7 text-slate-400">{scenario.outcome}</p></article>)}</section>

        <section className="rounded-3xl border border-white/8 bg-slate-950/45 p-6"><div className="flex items-center gap-3"><Webhook className="h-5 w-5 text-cyan-300" /><div><h2 className="font-bold text-white">قائمة تحقق للويب هوكس</h2><p className="mt-1 text-sm text-slate-500">لا تعتمد نجاح الدفع النهائي على استجابة المتصفح وحدها.</p></div></div><div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-3">{["اقرأ الجسم الخام للطلب قبل التحليل.", "تحقق من Stripe-Signature بالمفتاح المخصص للويب هوك.", "أعد 2xx سريعًا ثم نفّذ المعالجة المطوّلة."].map(item => <div key={item} className="flex gap-2 rounded-2xl bg-white/[0.035] p-4"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</div>)}</div></section>
      </section>
    </DashboardLayout>
  );
}
