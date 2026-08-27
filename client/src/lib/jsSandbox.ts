export const jsSandboxLimits = { maxCharacters: 40_000, maxRuntimeMs: 2_000, maxOutputLines: 120 } as const;
export type SandboxEvent = { type: "log"; text: string } | { type: "done"; text: string } | { type: "error"; text: string };
export type JavaScriptRepairProposal = { title: string; explanation: string; suggestedChange: string; boundary: string };

export function diagnoseJavaScriptFailure(source: string, errorText: string): JavaScriptRepairProposal[] {
  const normalizedError = errorText.toLowerCase();
  const normalizedSource = source.toLowerCase();
  const proposals: JavaScriptRepairProposal[] = [];
  if (normalizedError.includes("الشبكة غير متاح") || /fetch|xmlhttprequest|websocket/.test(normalizedError)) {
    proposals.push({ title: "استبدل طلب الشبكة بمدخل صريح", explanation: "العامل المعزول يمنع الشبكة عمدًا حتى لا يصل التجريب إلى خدمات أو حسابات خارجية.", suggestedChange: "// مرر البيانات التي تريد اختبارها كقيمة محلية بدل fetch أو WebSocket.\nconst sampleData = [{ id: 1, name: \"مثال\" }];\nconsole.log(sampleData);", boundary: "لا يفعّل هذا الاقتراح الشبكة ولا يرسل أي طلب." });
  }
  if (normalizedError.includes("توقف التنفيذ بعد") || /while\s*\(\s*true\s*\)|for\s*\(\s*;;\s*\)/.test(normalizedSource)) {
    proposals.push({ title: "اجعل التكرار محدودًا", explanation: "توقفت العملية عند المهلة لحماية المتصفح من حلقة طويلة أو غير منتهية.", suggestedChange: "// استخدم حدًا ثابتًا وتحققًا واضحًا لإنهاء الحلقة.\nfor (let index = 0; index < items.length; index += 1) {\n  console.log(items[index]);\n}", boundary: "راجع منطق الإنهاء قبل إعادة التشغيل؛ لا يُطبّق التعديل تلقائيًا." });
  }
  if (/syntaxerror|unexpected token|unexpected identifier/.test(normalizedError)) {
    proposals.push({ title: "راجع تركيب JavaScript", explanation: "يشير الخطأ إلى أن المتصفح لم يتمكن من تحليل الصياغة قبل التنفيذ.", suggestedChange: "// افحص الأقواس والاقتباسات والفواصل قرب السطر المبلغ عنه.\nconst result = values.map((value) => value * 2);", boundary: "هذا نموذج مراجعة، وليس تصحيحًا تلقائيًا لملفك." });
  }
  if (/referenceerror|is not defined/.test(normalizedError)) {
    proposals.push({ title: "عرّف الاسم قبل استخدامه", explanation: "اسم متغير أو دالة استُخدم قبل تعريفه أو خارج نطاقه المتاح.", suggestedChange: "// عرّف القيمة محليًا قبل الاستدعاء وتحقق من الاسم.\nconst value = 0;\nconsole.log(value);", boundary: "لا يبحث التشخيص في ملفات المنصة أو المتغيرات السرية." });
  }
  if (/typeerror|is not a function|cannot read propert/.test(normalizedError)) {
    proposals.push({ title: "تحقق من نوع القيمة", explanation: "تم استدعاء دالة أو خاصية على قيمة لا تدعمها في وقت التشغيل.", suggestedChange: "if (Array.isArray(items)) {\n  const doubled = items.map((value) => Number(value) * 2);\n  console.log(doubled);\n}", boundary: "راجع بيانات الإدخال بنفسك قبل نقل أي تعديل إلى مشروعك." });
  }
  return proposals.length ? proposals.slice(0, 3) : [{ title: "اقرأ رسالة الخطأ أولًا", explanation: "لم يتعرف التشخيص المحلي على نمط محدد. احتفظ بالرسالة وراجع السطر أو القيمة المشار إليها.", suggestedChange: "try {\n  // ضع العملية التي تريد فحصها هنا.\n} catch (error) {\n  console.error(error instanceof Error ? error.message : String(error));\n}", boundary: "لا يُشغّل التشخيص أي كود ولا يغير ملفك أو بيئتك." }];
}

const workerSource = `
  const safeText = value => { try { return typeof value === 'string' ? value : JSON.stringify(value); } catch { return String(value); } };
  const deny = name => () => { throw new Error(name + ' غير متاح داخل محطة JavaScript المعزولة'); };
  try { self.fetch = deny('الشبكة'); self.importScripts = deny('استيراد السكربتات'); self.WebSocket = undefined; self.EventSource = undefined; self.XMLHttpRequest = undefined; self.indexedDB = undefined; self.caches = undefined; if (self.navigator) self.navigator.sendBeacon = deny('الشبكة'); } catch (_) {}
  self.onmessage = async event => {
    const source = String(event.data?.source ?? '');
    const output = [];
    const emit = value => { if (output.length < 120) { const text = safeText(value); output.push(text); self.postMessage({ type: 'log', text }); } };
    const safeConsole = { log: (...args) => emit(args), info: (...args) => emit(args), warn: (...args) => emit(args), error: (...args) => emit(args) };
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const run = new AsyncFunction('console', '\\"use strict\\";\\n' + source);
      const result = await run(safeConsole);
      self.postMessage({ type: 'done', text: typeof result === 'undefined' ? 'اكتمل التنفيذ المحلي.' : safeText(result) });
    } catch (error) { self.postMessage({ type: 'error', text: error instanceof Error ? error.message : String(error) }); }
  };
`;

export function canRunJavaScript(source: string) { return source.trim().length > 0 && source.length <= jsSandboxLimits.maxCharacters; }
export function startJavaScriptSandbox(source: string, onEvent: (event: SandboxEvent) => void) {
  if (!canRunJavaScript(source)) throw new Error(source.trim() ? `الحد الأقصى هو ${jsSandboxLimits.maxCharacters.toLocaleString("ar")} حرف.` : "اكتب JavaScript قبل التشغيل.");
  const url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
  const worker = new Worker(url, { type: "classic", name: "devforge-js-sandbox" });
  let settled = false;
  const finish = () => { if (settled) return; settled = true; window.clearTimeout(timeout); worker.terminate(); URL.revokeObjectURL(url); };
  const timeout = window.setTimeout(() => { onEvent({ type: "error", text: `توقف التنفيذ بعد ${jsSandboxLimits.maxRuntimeMs / 1000} ثانيتين لحماية المتصفح.` }); finish(); }, jsSandboxLimits.maxRuntimeMs);
  worker.onmessage = event => { const message = event.data as SandboxEvent; if (!message || !["log", "done", "error"].includes(message.type)) return; onEvent(message); if (message.type !== "log") finish(); };
  worker.onerror = event => { onEvent({ type: "error", text: event.message || "تعذر تشغيل JavaScript في الصندوق المعزول." }); finish(); };
  worker.postMessage({ source });
  return { stop: () => { if (!settled) onEvent({ type: "error", text: "أوقف المستخدم التنفيذ المحلي." }); finish(); } };
}
