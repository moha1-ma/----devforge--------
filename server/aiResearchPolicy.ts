export const researchModes = ["off", "trusted-web"] as const;
export type ResearchMode = (typeof researchModes)[number];

export function resolveResearchMode(value: ResearchMode | undefined) {
  if (value === "trusted-web") {
    return {
      mode: value,
      requested: true,
      executed: false,
      provider: "built-in-web-search" as const,
      disclosure: "طُلب بحث ويب موثوق. سيُشغّل فقط لهذه الرسالة، وتُعرض روابط المصادر العائدة بوضوح عند توفرها.",
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
      ? "طلب المالك وضع بحث ويب موثوق لهذه الرسالة فقط. استخدم أداة البحث المتاحة عند الحاجة، ثم أدرج رابط كل مصدر استخدمته صراحة بصيغة Markdown. لا تخترع مصادر أو روابط، ولا تدّع البحث إذا لم تُرجع الأداة مصادر."
      : "لم يطلب المالك بحثًا خارجيًا لهذه الرسالة؛ اعتمد على سياق المحادثة فقط ولا تدّع الوصول إلى الويب.",
  ].join(" ");
}
