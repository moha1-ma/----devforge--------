export const miniWorkstationRoles = [
  { key: "architecture", title: "معمار النظام", englishTitle: "System architect", summary: "يفكك النطاق إلى وحدات وحدود واعتماديات قابلة للمراجعة.", englishSummary: "Breaks scope into reviewable modules, boundaries, and dependencies." },
  { key: "requirements", title: "محلل المتطلبات", englishTitle: "Requirements analyst", summary: "ينظم الهدف والقيود ومعايير القبول والأسئلة المفتوحة.", englishSummary: "Organizes objectives, constraints, acceptance criteria, and open questions." },
  { key: "experience", title: "مراجع تجربة المستخدم", englishTitle: "User-experience reviewer", summary: "يراجع تدفق الاستخدام والإتاحة وتسلسل الواجهة دون تعديلها.", englishSummary: "Reviews user flow, accessibility, and interface sequence without changing it." },
  { key: "frontend", title: "مراجع JavaScript والواجهة", englishTitle: "JavaScript and frontend reviewer", summary: "يقترح بنية مكونات JavaScript وحالات تحميل وخطأ واختبارات واجهة.", englishSummary: "Proposes JavaScript component structure, loading and error states, and UI tests." },
  { key: "backend", title: "مراجع Python والخادم", englishTitle: "Python and backend reviewer", summary: "يراجع تصميم خدمات Python والعقود والتحقق والصلاحيات والبيانات ضمن مقترح.", englishSummary: "Reviews proposed Python services, contracts, validation, authorization, and data design." },
  { key: "security", title: "مراجع الأمن الدفاعي", englishTitle: "Defensive security reviewer", summary: "يحدد المخاطر والضوابط وخطة اختبار دفاعية دون استغلالات.", englishSummary: "Identifies risks, controls, and a defensive test plan without exploit guidance." },
  { key: "testing", title: "مخطط الاختبارات", englishTitle: "Test planner", summary: "ينشئ حالات تحقق وحدود إدخال وخطة اختبار قابلة للتنفيذ يدويًا.", englishSummary: "Creates verification cases, input bounds, and a manually executable test plan." },
  { key: "javascript-diagnostics", title: "تشخيص JavaScript", englishTitle: "JavaScript diagnostics", summary: "يفسر أعراض الخطأ في JavaScript ويقترح إصلاحات مراجعية دون تشغيل أو كتابة.", englishSummary: "Explains JavaScript error symptoms and proposes review-only fixes without execution or writes." },
  { key: "research-provenance", title: "مراجع إسناد البحث", englishTitle: "Research provenance reviewer", summary: "ينظم أسئلة المصدر والإسناد والتحقق دون تصفح أو اتصال تلقائي.", englishSummary: "Organizes source, attribution, and verification questions without automatic browsing or connections." },
  { key: "release-readiness", title: "مراجع جاهزية الإصدار", englishTitle: "Release-readiness reviewer", summary: "يبني قائمة اعتماد للإصدار والمخاطر والمتابعة دون نشر أو تغيير بنية.", englishSummary: "Builds a release dependency, risk, and follow-up checklist without publishing or infrastructure changes." },
] as const;

export type MiniWorkstationKey = (typeof miniWorkstationRoles)[number]["key"];

export const miniWorkstationKeys = miniWorkstationRoles.map(role => role.key) as [MiniWorkstationKey, ...MiniWorkstationKey[]];

export function getMiniWorkstationRole(key: string) {
  return miniWorkstationRoles.find(role => role.key === key) ?? null;
}
