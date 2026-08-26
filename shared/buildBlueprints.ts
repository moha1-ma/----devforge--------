export type BuildBlueprintKey = "web" | "mobile" | "api" | "product";

export type BlueprintStep = {
  key: string;
  title: string;
  description: string;
  deliverable: string;
};

export const buildBlueprints: Record<BuildBlueprintKey, { title: string; summary: string; projectKey: string; steps: BlueprintStep[] }> = {
  web: {
    title: "موقع ويب احترافي",
    summary: "مسار من الفكرة إلى التصميم والصفحات والنشر مع قائمة مراجعة واضحة.",
    projectKey: "WEB",
    steps: [
      { key: "brief", title: "حدّد الهدف والجمهور", description: "اكتب المشكلة التي يحلها الموقع، الزائر المستهدف، ورسالة الصفحة الرئيسية.", deliverable: "ملخص منتج من صفحة واحدة" },
      { key: "structure", title: "ارسم الصفحات والمحتوى", description: "حدّد الصفحات الأساسية، التنقل، والنصوص التي يحتاجها كل قسم.", deliverable: "خريطة صفحات" },
      { key: "design", title: "صمّم الهوية والواجهة", description: "اختر أسلوبًا بصريًا وخطوطًا وألوانًا، ثم أنشئ صورًا عند الحاجة من الاستوديو.", deliverable: "نظام تصميم صغير" },
      { key: "build", title: "ابنِ الصفحات", description: "أنشئ ملفات HTML أو React وCSS داخل مساحة الكود، ثم راجع المعاينة المقيدة.", deliverable: "نسخة واجهة أولى" },
      { key: "launch", title: "اختبر وانشر", description: "اختبر الهاتف وسرعة التحميل والتدفق الأساسي قبل ربط نطاق أو نشر النسخة.", deliverable: "قائمة إطلاق مكتملة" },
    ],
  },
  mobile: {
    title: "تطبيق جوال",
    summary: "خطة منتج جوال تشمل رحلة المستخدم والشاشات وبيانات التطبيق والاختبار.",
    projectKey: "MOB",
    steps: [
      { key: "problem", title: "حدّد حالة الاستخدام", description: "اختر مهمة واحدة مهمة يحلها التطبيق للمستخدم بشكل متكرر.", deliverable: "وصف حالة استخدام" },
      { key: "flow", title: "صمّم رحلة المستخدم", description: "ارسم مراحل الدخول، الإنجاز، النجاح، والحالات الفارغة أو الخطأ.", deliverable: "تدفق شاشات" },
      { key: "data", title: "حدّد البيانات والخصوصية", description: "عرّف ما سيُحفظ للمستخدم وما يجب أن يبقى خاصًا ضمن الحساب.", deliverable: "نموذج بيانات" },
      { key: "screens", title: "ابنِ الشاشات", description: "ابدأ بشاشة واحدة قابلة للاستخدام ثم أضف الميزات بالتدريج.", deliverable: "نموذج تطبيقي أولي" },
      { key: "test", title: "اختبر على الهاتف", description: "تحقق من اللمس، الخطوط، السرعة، وتدفق الدخول قبل النشر.", deliverable: "قائمة اختبار هاتف" },
    ],
  },
  api: {
    title: "واجهة API وخدمة خلفية",
    summary: "مسار لتصميم API آمنة، بياناتها، صلاحياتها، واختبارها قبل الاستخدام العام.",
    projectKey: "API",
    steps: [
      { key: "contract", title: "صمّم العقد", description: "حدّد الموارد والمدخلات والمخرجات والأخطاء المتوقعة قبل كتابة التنفيذ.", deliverable: "مواصفات نقاط النهاية" },
      { key: "data", title: "نمذج البيانات", description: "أنشئ الجداول والعلاقات وحدود الوصول قبل حفظ أول سجل.", deliverable: "مخطط قاعدة بيانات" },
      { key: "auth", title: "أضف الهوية والصلاحيات", description: "حدّد من يستطيع القراءة أو الإنشاء أو التعديل لكل مورد.", deliverable: "مصفوفة صلاحيات" },
      { key: "implementation", title: "نفّذ واختبر", description: "اكتب نقاط النهاية واختبارات النجاح والفشل وحالات الحدود.", deliverable: "API قابلة للاختبار" },
      { key: "observe", title: "راقب ووثّق", description: "أضف توثيقًا وسجل أخطاء ومؤشرات استخدام قبل إدخال عملاء حقيقيين.", deliverable: "دليل تشغيل" },
    ],
  },
  product: {
    title: "منتج برمجي متكامل",
    summary: "مسار يجمع اكتشاف المنتج والواجهة والخدمة الخلفية والجودة والإطلاق التدريجي.",
    projectKey: "PROD",
    steps: [
      { key: "discovery", title: "اكتشف المشكلة", description: "صِغ فرضية واضحة ومستخدمًا محددًا ونتيجة قابلة للقياس.", deliverable: "فرضية منتج" },
      { key: "scope", title: "حدّد النسخة الأولى", description: "اختَر أصغر مجموعة مزايا تحل المشكلة دون بناء كل شيء مرة واحدة.", deliverable: "نطاق MVP" },
      { key: "experience", title: "صمّم التجربة", description: "اربط الشاشات والبيانات والحالات الفارغة في رحلة واحدة مفهومة.", deliverable: "تدفق تجربة" },
      { key: "delivery", title: "ابنِ على مراحل", description: "قسّم التنفيذ إلى عناصر عمل ومراجعات وإصدارات صغيرة قابلة للاختبار.", deliverable: "خطة تسليم" },
      { key: "iterate", title: "أطلق وتعلّم", description: "اجمع الملاحظات وصحح أهم مشكلة ثم أطلق نسخة محسنة.", deliverable: "حلقة تحسين" },
    ],
  },
};

export function isBuildBlueprintKey(value: string): value is BuildBlueprintKey {
  return Object.prototype.hasOwnProperty.call(buildBlueprints, value);
}
