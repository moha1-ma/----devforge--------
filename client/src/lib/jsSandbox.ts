export const jsSandboxLimits = { maxCharacters: 40_000, maxRuntimeMs: 2_000, maxOutputLines: 120 } as const;
export type SandboxEvent = { type: "log"; text: string } | { type: "done"; text: string } | { type: "error"; text: string };

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
