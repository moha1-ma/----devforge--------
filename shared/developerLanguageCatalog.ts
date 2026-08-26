export type DeveloperLanguage = {
  key: string;
  label: string;
  family: string;
  strengths: string[];
  reviewBoundary: string;
};

export const developerLanguageCatalog: DeveloperLanguage[] = [
  { key: "python", label: "Python", family: "Automation & AI", strengths: ["الذكاء الاصطناعي", "واجهات API", "البيانات"], reviewBoundary: "ينتج مخططًا أو كودًا مقترحًا فقط؛ لا يشغّل Python أو يثبت حزمًا." },
  { key: "typescript", label: "TypeScript", family: "Web", strengths: ["واجهات الويب", "خدمات Node", "أنظمة الأنواع"], reviewBoundary: "لا يكتب أو يبني أو ينشر مشروعًا تلقائيًا." },
  { key: "javascript", label: "JavaScript", family: "Web", strengths: ["تجارب المتصفح", "Node.js", "التكاملات"], reviewBoundary: "لا ينفذ أي script أو اتصال خارجي." },
  { key: "go", label: "Go", family: "Backend", strengths: ["الخدمات", "التزامن", "الأدوات"], reviewBoundary: "لا يبني binaries أو يشغّل خدمات." },
  { key: "java", label: "Java", family: "Enterprise", strengths: ["أنظمة الأعمال", "Spring", "الخدمات"], reviewBoundary: "لا يعدّل مستودعات أو بيئات تشغيل." },
  { key: "csharp", label: "C#", family: "Enterprise", strengths: [".NET", "الخدمات", "السطح المكتب"], reviewBoundary: "لا ينفذ عمليات build أو نشر." },
  { key: "cpp", label: "C++", family: "Systems", strengths: ["الأداء", "الأنظمة", "المكتبات"], reviewBoundary: "لا يترجم أو يشغّل كودًا أصليًا." },
  { key: "rust", label: "Rust", family: "Systems", strengths: ["سلامة الذاكرة", "الخدمات", "الأدوات"], reviewBoundary: "لا ينفذ Cargo أو يتصل بسلاسل توريد." },
  { key: "php", label: "PHP", family: "Web", strengths: ["Laravel", "المواقع", "الخدمات"], reviewBoundary: "لا يغيّر استضافة أو ملفات الإنتاج." },
  { key: "ruby", label: "Ruby", family: "Web", strengths: ["Rails", "النماذج الأولية", "المنتجات"], reviewBoundary: "لا يشغّل Rails أو يغير البيانات." },
  { key: "kotlin", label: "Kotlin", family: "Mobile", strengths: ["Android", "الخدمات", "المشاركة"], reviewBoundary: "لا ينشئ APK أو يرسل إلى متجر." },
  { key: "swift", label: "Swift", family: "Mobile", strengths: ["iOS", "SwiftUI", "التطبيقات"], reviewBoundary: "لا يوقع أو يبني أو يرسل تطبيق Apple." },
  { key: "sql", label: "SQL", family: "Data", strengths: ["المخططات", "الاستعلامات", "RLS"], reviewBoundary: "يعرض SQL للمراجعة ولا ينفذ أي استعلام." },
  { key: "html-css", label: "HTML & CSS", family: "Web", strengths: ["الواجهات", "إتاحة الوصول", "التخطيط"], reviewBoundary: "ينشئ مسودات لا تُحفظ إلى ملفات تلقائيًا." },
];

export const developerLanguageKeys = developerLanguageCatalog.map(language => language.key) as [string, ...string[]];

export function getDeveloperLanguage(key: string) {
  return developerLanguageCatalog.find(language => language.key === key) ?? null;
}
