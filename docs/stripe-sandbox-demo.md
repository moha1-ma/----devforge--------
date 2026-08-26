# Stripe: نص الاختبار التجريبي لـ DevForge

> **نطاق آمن:** هذا النص مخصص فقط لمفاتيح `sk_test_`. يرفض مفاتيح الإنتاج تلقائيًا، ولا يؤكد وسيلة دفع أو يرسل أي عملية مالية حقيقية.

## ما الذي يفعله النص؟

ينشئ النص عميلًا تجريبيًا ثم `PaymentIntent` بقيمة 10.99 USD في Stripe Sandbox. لا يمرّر بطاقات ولا يستدعي تأكيد الدفع، لذلك تكون النتيجة كائن اختبار قابلًا للفحص من لوحة Stripe فقط. يعرض النص معرّفات مختصرة في الطرفية، ويحافظ على المفتاح السري خارج الملفات.

## التشغيل بعد إعداد مفاتيح الاختبار

بعد إضافة مفاتيح Stripe التجريبية من **Settings → Payment**، شغّل النص في بيئة تطوير تحتوي على `STRIPE_SECRET_KEY`:

```bash
cd /home/ubuntu/devforge-platform
node scripts/stripe-sandbox-demo.mjs
```

يجب أن تكون النتيجة كائن JSON قريبًا من الآتي:

```json
{
  "mode": "sandbox",
  "customer": "cus_…",
  "paymentIntent": "pi_…",
  "status": "requires_payment_method",
  "amount": 1099,
  "currency": "usd"
}
```

## سيناريو عرض موجز

ابدأ بعرض مساحة DevForge ثم انتقل إلى لوحة Stripe Sandbox. اشرح أن الواجهة تستدعي الخادم فقط، وأن الخادم يحتفظ بالمفتاح السري ويُنشئ عميلًا تجريبيًا. بعد ذلك أنشئ `PaymentIntent` بمعرّف idempotency ثابت للحالة التجريبية، ثم افتح الكائن الناتج في Dashboard ووضّح حالته `requires_payment_method`. أكّد أن الخطوة التالية في منتج حقيقي هي تمرير `client_secret` للعميل المقصود فقط عبر TLS، ثم تأكيد الدفع من واجهة Stripe المخصصة أو Checkout. [1]

## كيفية اختبار أهم القدرات

| القدرة | نقطة النهاية / التدفق | ما الذي ينبغي التحقق منه في Sandbox |
|---|---|---|
| العملاء | `POST /v1/customers` | إنشاء العميل وظهور معرّفه في Dashboard |
| Payment Intents | `POST /v1/payment_intents` | المبلغ والعملة والحالة ومعرّف الـ PaymentIntent |
| Checkout Sessions | `POST /v1/checkout/sessions` | إنشاء جلسة دفع مستضافة أو مضمّنة مع بيانات التسعير |
| الاشتراكات | Products → Prices → Subscriptions | إنشاء سعر تجريبي ثم التحقق من دورة الفاتورة |
| الاسترداد | `POST /v1/refunds` | استخدام PaymentIntent/Charge تجريبي مكتمل فقط |
| Webhooks | Endpoint محمي بتوقيع Stripe | رفض التوقيع غير الصحيح ومعالجة حدث اختبار صحيح |

## نقاط تنفيذ مهمة

توصي Stripe غالبًا بـ **Checkout Sessions** لأنّها تتولى جوانب كثيرة من عملية الشراء، مثل الضرائب والخصومات والشحن والاشتراكات، مع تقليل كود الواجهة المطلوب. استخدم **Payment Intents** عندما تحتاج إلى تحكم أدق في دورة الدفع وحالات المصادقة. [1] [2]

استخدم مفتاح idempotency عند إنشاء PaymentIntent لتقليل خطر الإنشاء المكرر، وأعد استخدام الـ PaymentIntent عند استئناف نفس جلسة الشراء. لا تسجّل `client_secret`، ولا تضعه في رابط، ولا تُخزّن بيانات حساسة في metadata أو الوصف. [1]

في الويب هوكس، تحقّق من التوقيع باستخدام الجسم الخام للطلب وترويسة `Stripe-Signature`. يجب أن يستجيب المعالج سريعًا بحالة `2xx` ثم يعالج المهام الطويلة خارجيًا. يمكن استخدام Stripe CLI لإعادة توجيه أحداث Sandbox وتشغيل أحداث اختبار مثل `payment_intent.succeeded`. [3]

## المراجع

[1]: https://docs.stripe.com/payments/payment-intents
[2]: https://docs.stripe.com/payments/checkout-sessions
[3]: https://docs.stripe.com/webhooks
[4]: https://docs.stripe.com/testing-use-cases
