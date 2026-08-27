export type TechnicalPartner = {
  providerKey: string;
  name: string;
  focus: string;
  description: string;
  documentationUrl: string;
  dataScope: string;
  connectionMethod: "مراجعة جلسة المالك" | "مصدر عام مضمن";
  requestable: boolean;
};

export const technicalPartnerCatalog: TechnicalPartner[] = [
  { providerKey: "github", name: "GitHub", focus: "إدارة الشفرة", description: "مستودعات ومراجعات وفروع يتم اختيارها صراحة من المالك.", documentationUrl: "https://docs.github.com/en/rest", dataScope: "بيانات وصفية أو قراءة مقيدة بعد تفويض صريح", connectionMethod: "مراجعة جلسة المالك", requestable: true },
  { providerKey: "supabase", name: "Supabase", focus: "البيانات والهوية", description: "خدمات قاعدة البيانات والهوية والتخزين لتطبيقات الويب والهاتف.", documentationUrl: "https://supabase.com/docs", dataScope: "مخطط وإرشاد فقط؛ لا مفاتيح خدمة أو بيانات صفوف", connectionMethod: "مراجعة جلسة المالك", requestable: true },
  { providerKey: "sentry", name: "Sentry", focus: "المراقبة والتشخيص", description: "مراقبة أخطاء وأداء لمنح المالك رؤية قابلة للمراجعة حول المشكلات.", documentationUrl: "https://docs.sentry.io/", dataScope: "قراءة مقيدة لمشكلات وأداء محددين بعد تفويض صريح", connectionMethod: "مراجعة جلسة المالك", requestable: true },
  { providerKey: "replit", name: "Replit", focus: "تطوير سحابي", description: "بيئة تطوير سحابية منفصلة لبناء التطبيقات من المتصفح عبر حساب المالك.", documentationUrl: "https://docs.replit.com/features/integrations/overview", dataScope: "لا بيانات أو كود قبل مراجعة اتصال مستقل", connectionMethod: "مراجعة جلسة المالك", requestable: true },
  { providerKey: "openalex", name: "OpenAlex", focus: "بحث ومعرفة مفتوحة", description: "فهرس أبحاث عامة يظهر داخل مركز البحث العالمي مع رابط المصدر لكل نتيجة.", documentationUrl: "https://help.openalex.org/", dataScope: "نتائج عامة للقراءة فقط", connectionMethod: "مصدر عام مضمن", requestable: false },
  { providerKey: "crossref", name: "Crossref", focus: "معرّفات المنشورات", description: "بيانات وصفية عامة للمنشورات ومعرّفات DOI ضمن البحث العالمي المحدود.", documentationUrl: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/", dataScope: "نتائج عامة للقراءة فقط", connectionMethod: "مصدر عام مضمن", requestable: false },
];
