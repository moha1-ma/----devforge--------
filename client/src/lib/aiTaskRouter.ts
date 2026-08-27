export const AI_ROUTER_MAX_LENGTH = 1800;

export type AiWorkstream = {
  id: "architecture" | "code" | "research" | "integration" | "sandbox";
  title: string;
  description: string;
  route: string;
  priority: "الآن" | "بعد ذلك" | "مراجعة";
};

export type AiRoutingPlan = {
  summary: string;
  workstreams: AiWorkstream[];
  boundaries: string[];
};

const patterns = {
  architecture: /(?:بنية|معمار|تصميم|نظام|منصة|تطبيق|موقع|هيكل)/i,
  code: /(?:كود|برمج|إصلاح|خطأ|bug|typescript|javascript|python|api)/i,
  research: /(?:بحث|مصدر|توثيق|دراسة|معلومة|معرفة|بيانات)/i,
  integration: /(?:تكامل|ربط|خدمة|مزود|oauth|مفتاح|واجهة)/i,
};

const streamCatalog: Record<AiWorkstream["id"], AiWorkstream> = {
  architecture: { id: "architecture", title: "هندسة الحل", description: "حدد النطاق والمخاطر والاختبارات قبل أي تنفيذ.", route: "/developer-center", priority: "الآن" },
  code: { id: "code", title: "مراجعة الشيفرة", description: "افحص الملفات الخاصة وأنشئ اقتراح إصلاح يدوي فقط.", route: "/code", priority: "بعد ذلك" },
  research: { id: "research", title: "بحث موثق", description: "اجمع مصادر ظاهرة وقابلة للتحقق قبل اتخاذ قرار.", route: "/global-research", priority: "بعد ذلك" },
  integration: { id: "integration", title: "حدود التكامل", description: "راجع التوثيق ونطاق الصلاحيات قبل ربط أي خدمة.", route: "/integrations", priority: "مراجعة" },
  sandbox: { id: "sandbox", title: "تجربة JavaScript محلية", description: "جرّب منطقًا محدودًا داخل بيئة متصفح معزولة دون شبكة أو أسرار.", route: "/javascript-lab", priority: "مراجعة" },
};

export function normalizeAiTask(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, AI_ROUTER_MAX_LENGTH);
}

export function createAiRoutingPlan(value: string): AiRoutingPlan | null {
  const task = normalizeAiTask(value);
  if (task.length < 24) return null;
  const selected = (Object.entries(patterns) as Array<[keyof typeof patterns, RegExp]>).filter(([, pattern]) => pattern.test(task)).map(([id]) => id);
  const ids = (["architecture", ...selected, "sandbox"] as AiWorkstream["id"][]).filter((id, index, values) => values.indexOf(id) === index);
  return {
    summary: `خطة مراجعة سريعة لطلبك: ${task.slice(0, 150)}${task.length > 150 ? "…" : ""}`,
    workstreams: ids.slice(0, 5).map((id) => streamCatalog[id]),
    boundaries: ["المخرجات خطة ومقترحات للمراجعة، وليست تنفيذًا تلقائيًا.", "لا يتم إرسال طلبك إلى مزود خارجي أو فتح حساب أو استخدام مفتاح من هذه الصفحة.", "يُستخدم كل مسار بعد اختيار المالك له يدويًا ضمن صلاحياته الخاصة."],
  };
}

export const vettedAiProviderReferences = [
  { name: "OpenAI للمطورين", category: "نماذج وأدوات", url: "https://developers.openai.com/api/docs" },
  { name: "Claude Platform", category: "نماذج ووكلاء", url: "https://platform.claude.com/docs/en/home" },
  { name: "Google Gemini API", category: "نص وصور ووكلاء", url: "https://ai.google.dev/gemini-api/docs" },
] as const;
