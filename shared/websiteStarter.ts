export const websiteVisualPresets = {
  studio: { label: "استوديو احترافي", description: "مظهر تقني هادئ يركز على الثقة والوضوح." },
  commerce: { label: "عرض تجاري", description: "واجهة واضحة للخدمات والعروض ودعوات الإجراء." },
  portfolio: { label: "معرض أعمال", description: "تنظيم بصري يبرز الخبرة والمشروعات." },
  launch: { label: "إطلاق منتج", description: "صفحة مركزة لتحويل الزوار إلى مهتمين بالمنتج." },
} as const;

export type WebsiteVisualPreset = keyof typeof websiteVisualPresets;

export type WebsiteStarterInput = {
  title: string;
  businessType: string;
  brief: string;
  visualPreset: WebsiteVisualPreset;
  palette: string;
  primaryCta: string;
  desiredDomain?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function isWebsiteVisualPreset(value: string): value is WebsiteVisualPreset {
  return value in websiteVisualPresets;
}

export function createWebsiteStarterFiles(input: WebsiteStarterInput) {
  const title = escapeHtml(input.title.trim());
  const businessType = escapeHtml(input.businessType.trim());
  const brief = escapeHtml(input.brief.trim());
  const cta = escapeHtml(input.primaryCta.trim());
  const palette = input.palette === "amber" ? "amber" : input.palette === "rose" ? "rose" : input.palette === "emerald" ? "emerald" : "cyan";
  const domain = input.desiredDomain?.trim() ? escapeHtml(input.desiredDomain.trim()) : "لم يُطلب نطاق بعد";
  const visualCopy = websiteVisualPresets[input.visualPreset].label;

  return {
    "index.html": `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${brief}" />
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body data-palette="${palette}">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="${title}">${title}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">القائمة</button>
      <nav id="site-nav" class="site-nav" aria-label="التنقل الرئيسي">
        <a href="#about">عن المشروع</a><a href="#offers">الخدمات</a><a class="button button-small" href="#contact">${cta}</a>
      </nav>
    </header>
    <main id="top">
      <section class="hero">
        <div class="eyebrow">${businessType} · ${visualCopy}</div>
        <h1>${title}</h1>
        <p>${brief}</p>
        <div class="hero-actions"><a class="button" href="#contact">${cta}</a><a class="text-link" href="#about">اكتشف المزيد</a></div>
        <div class="hero-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
      </section>
      <section id="about" class="section two-columns">
        <div><p class="eyebrow">فكرة الموقع</p><h2>رسالة واضحة وتجربة مرتبة.</h2></div>
        <p>هذه نقطة بداية قابلة للتحرير من داخل DevForge. استبدل النصوص والأقسام بما يناسب مشروعك، ثم أضف صفحاتك وملفاتك الخاصة.</p>
      </section>
      <section id="offers" class="section">
        <p class="eyebrow">ما نقدمه</p><div class="cards"><article><h3>وضوح</h3><p>محتوى منظم يساعد الزائر على فهم العرض بسرعة.</p></article><article><h3>مرونة</h3><p>ملفات HTML وCSS وJavaScript مستقلة وسهلة التوسيع.</p></article><article><h3>انطلاق</h3><p>هيكل جاهز للمعاينة ثم النشر عبر المسار الذي تختاره.</p></article></div>
      </section>
      <section id="contact" class="section contact"><p class="eyebrow">الخطوة التالية</p><h2>${cta}</h2><p>النطاق المقترح: <strong>${domain}</strong></p><a class="button" href="mailto:hello@example.com">تواصل الآن</a></section>
    </main>
    <footer><span>© ${title}</span><span>تم إعداد البداية داخل DevForge</span></footer>
    <script src="app.js"></script>
  </body>
</html>`,
    "styles.css": `:root { --ink:#09111f; --paper:#f6f8fb; --muted:#5c687a; --line:#d9e1ea; --accent:#14b8a6; --accent-ink:#043c3a; }
body[data-palette="amber"] { --accent:#f59e0b; --accent-ink:#4b2900; } body[data-palette="rose"] { --accent:#e11d48; --accent-ink:#50051a; } body[data-palette="emerald"] { --accent:#10b981; --accent-ink:#023527; }
*{box-sizing:border-box} html{scroll-behavior:smooth} body{margin:0;background:var(--paper);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.7}.site-header{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:0 7vw;border-bottom:1px solid var(--line);background:rgba(246,248,251,.88);backdrop-filter:blur(14px);position:sticky;top:0;z-index:5}.brand{font-weight:850;font-size:1.12rem;color:var(--ink);text-decoration:none}.site-nav{display:flex;align-items:center;gap:20px}.site-nav a{color:var(--muted);text-decoration:none;font-weight:650}.button{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px;background:var(--accent);color:var(--accent-ink)!important;padding:13px 22px;font-weight:850;text-decoration:none;transition:transform 160ms cubic-bezier(.23,1,.32,1),box-shadow 160ms}.button:hover{box-shadow:0 10px 25px color-mix(in srgb,var(--accent),transparent 70%)}.button:active{transform:scale(.97)}.button-small{padding:8px 14px}.menu-toggle{display:none}.hero{min-height:620px;padding:120px 7vw 88px;position:relative;overflow:hidden;display:grid;align-content:center;max-width:1280px;margin:auto}.hero>*:not(.hero-orbit){position:relative;z-index:1;max-width:700px}.eyebrow{color:var(--accent-ink);font-weight:800;letter-spacing:.04em;font-size:.86rem}.hero h1{font-size:clamp(3rem,8vw,6.9rem);line-height:.98;letter-spacing:-.065em;margin:18px 0 24px}.hero p{font-size:1.17rem;color:var(--muted);max-width:600px}.hero-actions{display:flex;gap:22px;align-items:center;margin-top:30px}.text-link{color:var(--ink);font-weight:800}.hero-orbit{position:absolute;width:min(55vw,670px);height:min(55vw,670px);left:-9vw;top:80px;border:1px solid var(--line);border-radius:50%;background:radial-gradient(circle at 34% 34%,color-mix(in srgb,var(--accent),transparent 62%),transparent 53%)}.hero-orbit span{position:absolute;width:22px;height:22px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 10px color-mix(in srgb,var(--accent),transparent 88%)}.hero-orbit span:nth-child(1){top:12%;left:50%}.hero-orbit span:nth-child(2){bottom:17%;right:10%}.hero-orbit span:nth-child(3){bottom:10%;left:20%;width:12px;height:12px}.section{max-width:1120px;margin:auto;padding:90px 7vw;border-top:1px solid var(--line)}.section h2{font-size:clamp(2rem,4vw,3.5rem);line-height:1.1;letter-spacing:-.04em;margin:13px 0}.two-columns{display:grid;grid-template-columns:1fr 1fr;gap:8vw}.two-columns>p{color:var(--muted);font-size:1.08rem}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}.cards article{padding:28px;border:1px solid var(--line);border-radius:22px;background:#fff}.cards h3{margin:0;font-size:1.3rem}.cards p,.contact p{color:var(--muted)}.contact{background:var(--ink);color:#fff;max-width:none;padding-right:max(7vw,calc((100vw - 1120px)/2));padding-left:max(7vw,calc((100vw - 1120px)/2))}.contact .eyebrow{color:var(--accent)}.contact p{color:#c3ccd7}footer{padding:28px 7vw;display:flex;justify-content:space-between;gap:18px;color:var(--muted);font-size:.9rem}@media(max-width:720px){.site-header{padding:0 5vw}.menu-toggle{display:block;border:1px solid var(--line);border-radius:999px;background:#fff;padding:8px 12px;color:var(--ink)}.site-nav{display:none;position:absolute;top:70px;right:5vw;left:5vw;padding:18px;flex-direction:column;align-items:stretch;background:#fff;border:1px solid var(--line);border-radius:18px}.site-nav[data-open="true"]{display:flex}.hero{min-height:590px;padding:92px 6vw 70px}.hero-orbit{width:92vw;height:92vw;left:-35vw;top:120px}.two-columns,.cards{grid-template-columns:1fr}.section{padding:68px 6vw}footer{padding:24px 6vw;flex-direction:column}.hero-actions{gap:16px;flex-wrap:wrap}}`,
    "app.js": `const button = document.querySelector('.menu-toggle'); const nav = document.querySelector('.site-nav'); if (button && nav) button.addEventListener('click', () => { const open = nav.dataset.open === 'true'; nav.dataset.open = String(!open); button.setAttribute('aria-expanded', String(!open)); });`,
    "README.md": `# ${input.title.trim()}\n\nقالب موقع أولي أُنشئ داخل DevForge بناءً على وصف: ${input.brief.trim()}\n\n## الملفات\n\n- \`index.html\`: الهيكل والمحتوى.\n- \`styles.css\`: المظهر المتجاوب واللوحة البصرية.\n- \`app.js\`: فتح وإغلاق قائمة الهاتف فقط.\n\n## النطاق\n\nالنطاق المقترح: ${input.desiredDomain?.trim() || "لم يُحدد"}. لا يسجل DevForge نطاقات أو يشتريها تلقائيًا؛ استخدم مركز النطاقات لإعداد ربط نطاق تملكه أو لاتخاذ خطوة شراء صريحة لدى جهة تسجيل.\n`,
  };
}
