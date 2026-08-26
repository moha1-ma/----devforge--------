export const domainCatalogSeed = [
  ["novaforge.com", "تقنية", "منصة بناء منتجات"],
  ["nimbusdesk.com", "إنتاجية", "مساحة عمل للفرق"],
  ["siteverge.com", "ويب", "استوديو مواقع"],
  ["brightledger.com", "أعمال", "لوحة تقارير"],
  ["cloudcanvas.com", "إبداع", "معرض رقمي"],
  ["prismlaunch.com", "منتجات", "إطلاق منتج"],
  ["orbitmarket.com", "تجارة", "سوق تخصصي"],
  ["flowmetric.com", "تحليلات", "مؤشرات تشغيل"],
  ["craftsignal.com", "تسويق", "هوية وحملات"],
  ["urbanpilot.com", "خدمات", "خدمة محلية"],
  ["leafpoint.com", "استدامة", "حلول خضراء"],
  ["devharbor.com", "برمجة", "مجتمع مطورين"],
  ["pixelroute.com", "تصميم", "أعمال بصرية"],
  ["safesprint.com", "أمان", "حوكمة تقنية"],
  ["northstack.com", "سحابة", "بنية تطبيقات"],
  ["kindlattice.com", "تعليم", "تعلم ومنهجيات"],
  ["pulseworks.com", "صحة", "متابعة خدمات"],
  ["boldbranch.com", "استشارات", "خبرة مهنية"],
  ["storyport.com", "محتوى", "نشر رقمي"],
  ["clearhaven.com", "عقارات", "تجربة عقارية"],
] as const;

export function isDomainCandidate(value: string) {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value);
}
