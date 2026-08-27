export const PWA_RELEASE = "2026-08-27-r2";

export function buildServiceWorkerUrl() {
  return `/service-worker.js?release=${encodeURIComponent(PWA_RELEASE)}`;
}

export type WaitingWorker = { postMessage: (message: { type: "SKIP_WAITING" }) => void };

export function activateWaitingWorker(worker: WaitingWorker | null | undefined) {
  if (!worker) return false;
  worker.postMessage({ type: "SKIP_WAITING" });
  return true;
}

export function registerDevForgeServiceWorker(onUpdateReady: (apply: () => void) => void) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  let applyRequested = false;
  const register = () => {
    void navigator.serviceWorker.register(buildServiceWorkerUrl()).then((registration) => {
      const offerUpdate = () => {
        if (!registration.waiting) return;
        onUpdateReady(() => {
          applyRequested = activateWaitingWorker(registration.waiting);
        });
      };
      offerUpdate();
      registration.addEventListener("updatefound", () => {
        registration.installing?.addEventListener("statechange", () => {
          if (registration.installing?.state === "installed") offerUpdate();
        });
      });
      void registration.update().catch(() => undefined);
    }).catch((error) => console.warn("[PWA] Service worker registration skipped", error));
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (applyRequested) window.location.reload();
  });
  window.addEventListener("load", register, { once: true });
}
