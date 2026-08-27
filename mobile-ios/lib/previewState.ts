export const WEB_PREVIEW_TIMEOUT_MS = 12_000;

export type PreviewState = { attempt: number; loading: boolean; error: string | null };

export function startPreview(attempt = 0): PreviewState { return { attempt, loading: true, error: null }; }
export function completePreview(state: PreviewState): PreviewState { return { ...state, loading: false, error: null }; }
export function failPreview(state: PreviewState, reason: "timeout" | "network"): PreviewState {
  return { ...state, loading: false, error: reason === "timeout" ? "استغرق فتح مساحة العمل وقتًا أطول من المتوقع. يمكنك إعادة المحاولة أو العودة إلى لوحة DevForge." : "تعذر فتح منصة DevForge. تحقق من اتصالك ومن أن الرابط المنشور صحيح، ثم حاول مرة أخرى." };
}
export function retryPreview(state: PreviewState): PreviewState { return startPreview(state.attempt + 1); }
