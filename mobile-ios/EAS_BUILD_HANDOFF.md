# تجهيز بناء iPhone عبر EAS

هذا الملف يجهز التطبيق فقط، ولا ينفذ بناءً أو تسجيل دخول أو رفعًا إلى Apple أو Expo.

## ملفات الإعداد

يحتوي `eas.json` على ملفين واضحين:

| الملف | الاستخدام | ما لا يفعله تلقائيًا |
|---|---|---|
| `preview` | بناء داخلي للاختبار على جهاز حقيقي | لا يرفع إلى TestFlight أو App Store. |
| `production` | بناء IPA مخصص لاحقًا لـ TestFlight أو App Store | لا يبدأ بناءً ولا يرسل أي ملف تلقائيًا. |

كلا الملفين يربطان التطبيق بالنطاق المستقل المنشور `https://devforgeapp-grp92cnd.manus.space`. ومعرّف الحزمة هو `space.manus.devforgeapp.grp92cnd` ويجب على حامل حساب Apple التحقق من إمكان تسجيله قبل أي بناء موزّع.

## أوامر لاحقة تحت تحكم المالك

بعد اعتماد Apple للعضوية أو إعفاء الرسوم، وتسجيل الدخول بنفسك إلى Expo وApple، يمكن استخدام الأوامر التالية من مجلد `mobile-ios`:

```bash
npm run validate
npx eas-cli@latest build --platform ios --profile preview
npx eas-cli@latest build --platform ios --profile production
```

يشغّل `npm run validate` اختبارات المشروع وتدقيق TypeScript والتحقق من ملف Expo المحلي؛ لا ينشئ build ولا يتصل بحساب Apple.

لا تنفذ أمر إرسال مثل `eas submit` قبل أن يراجع المالك بيانات App Store Connect، وسياسة الخصوصية، ورابط الدعم، وبيانات المراجعة، ثم يؤكد الإرسال صراحة. يطلب EAS أثناء البناء بيانات Apple أو شهادات التوقيع؛ أدخلها داخل جلسة المالك فقط ولا تضفها إلى الملفات أو المحادثة.

## مراجع

1. [Expo: Build your project for app stores](https://docs.expo.dev/deploy/build-project/)
2. [Expo: Configure EAS Build with eas.json](https://docs.expo.dev/build/eas-json/)
3. [Expo: Submit to the Apple App Store](https://docs.expo.dev/submit/ios/)
