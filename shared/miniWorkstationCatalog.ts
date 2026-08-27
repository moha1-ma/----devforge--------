export const miniWorkstationRoles = [
  { key: "architecture", title: "معمار النظام", summary: "يفكك النطاق إلى وحدات وحدود واعتماديات قابلة للمراجعة." },
  { key: "requirements", title: "محلل المتطلبات", summary: "ينظم الهدف والقيود ومعايير القبول والأسئلة المفتوحة." },
  { key: "experience", title: "مراجع تجربة المستخدم", summary: "يراجع تدفق الاستخدام والإتاحة وتسلسل الواجهة دون تعديلها." },
  { key: "frontend", title: "مراجع JavaScript والواجهة", summary: "يقترح بنية مكونات JavaScript وحالات تحميل وخطأ واختبارات واجهة." },
  { key: "backend", title: "مراجع Python والخادم", summary: "يراجع تصميم خدمات Python والعقود والتحقق والصلاحيات والبيانات ضمن مقترح." },
  { key: "security", title: "مراجع الأمن الدفاعي", summary: "يحدد المخاطر والضوابط وخطة اختبار دفاعية دون استغلالات." },
  { key: "testing", title: "مخطط الاختبارات", summary: "ينشئ حالات تحقق وحدود إدخال وخطة اختبار قابلة للتنفيذ يدويًا." },
  { key: "javascript-diagnostics", title: "تشخيص JavaScript", summary: "يفسر أعراض الخطأ في JavaScript ويقترح إصلاحات مراجعية دون تشغيل أو كتابة." },
  { key: "research-provenance", title: "مراجع إسناد البحث", summary: "ينظم أسئلة المصدر والإسناد والتحقق دون تصفح أو اتصال تلقائي." },
  { key: "release-readiness", title: "مراجع جاهزية الإصدار", summary: "يبني قائمة اعتماد للإصدار والمخاطر والمتابعة دون نشر أو تغيير بنية." },
] as const;

export type MiniWorkstationKey = (typeof miniWorkstationRoles)[number]["key"];

export const miniWorkstationKeys = miniWorkstationRoles.map(role => role.key) as [MiniWorkstationKey, ...MiniWorkstationKey[]];

export function getMiniWorkstationRole(key: string) {
  return miniWorkstationRoles.find(role => role.key === key) ?? null;
}
