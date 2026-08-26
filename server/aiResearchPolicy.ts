export const researchModes = ["off", "trusted-web"] as const;
export type ResearchMode = (typeof researchModes)[number];

export function resolveResearchMode(value: ResearchMode | undefined) {
  if (value === "trusted-web") {
    return {
      mode: value,
      requested: true,
      executed: false,
      provider: "not-configured" as const,
      disclosure: "طُلب بحث موثوق، لكن لا يوجد مزود بحث مهيأ داخل DevForge لهذه الرسالة؛ لم يُرسل أي طلب خارجي ولم تُنشأ مصادر.",
    };
  }
  return {
    mode: "off" as const,
    requested: false,
    executed: false,
    provider: "not-requested" as const,
    disclosure: "لم يُطلب بحث خارجي لهذه الرسالة.",
  };
}

export function researchQualityInstruction(researchMode: ResearchMode | undefined) {
  const status = resolveResearchMode(researchMode);
  return [
    "اعرض الحقائق والافتراضات بوضوح، واذكر حدود الثقة عندما لا تكفي المعطيات.",
    "لا تختلق مصادر أو روابط أو نتائج بحث. إذا قدم المستخدم روابط أو نصوصًا، اذكر أنها المصدر الذي راجعته.",
    status.requested
      ? "طلب المالك وضع بحث موثوق، لكن لا يوجد مزود بحث مهيأ داخل تطبيق DevForge لهذه الرسالة. لا تدّع إجراء بحث أو فتح صفحات أو امتلاك استشهادات خارجية. قدّم أفضل تحليل قائم على السياق المتاح، واقترح ما ينبغي التحقق منه لاحقًا."
      : "لم يطلب المالك بحثًا خارجيًا لهذه الرسالة؛ اعتمد على سياق المحادثة فقط ولا تدّع الوصول إلى الويب.",
  ].join(" ");
}
