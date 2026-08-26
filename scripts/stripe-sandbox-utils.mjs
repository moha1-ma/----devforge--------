export function requireStripeSandboxKey(secretKey) {
  if (!secretKey) {
    throw new Error("لم يتم العثور على مفتاح Stripe التجريبي. أضف مفتاح sk_test_ عبر إعدادات الدفع قبل التشغيل.");
  }
  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("يرفض النص أي مفتاح Stripe حي. استخدم مفتاح sk_test_ داخل بيئة الاختبار فقط.");
  }
  return secretKey;
}

export function stripeFormBody(values) {
  const body = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => body.set(key, String(value)));
  return body;
}

export function maskStripeId(value) {
  if (!value) return "غير متاح";
  return value.length <= 10 ? value : `${value.slice(0, 7)}…${value.slice(-4)}`;
}
