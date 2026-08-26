export type DevForgeRoute = "/" | "/ai" | "/website-studio" | "/code" | "/domains" | "/plans" | "/integrations";

export function normalizeDevForgeOrigin(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(candidate);
    const hasUnexpectedParts = Boolean(url.username || url.password || url.search || url.hash) || url.pathname !== "/";
    if (url.protocol !== "https:" || hasUnexpectedParts) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export const DEFAULT_DEVFORGE_ORIGIN = "https://devforgeapp-grp92cnd.manus.space";
export const DEVFORGE_ORIGIN = normalizeDevForgeOrigin(process.env.EXPO_PUBLIC_DEVFORGE_ORIGIN ?? DEFAULT_DEVFORGE_ORIGIN);

export function makeWorkspaceUrl(route: DevForgeRoute, origin = DEVFORGE_ORIGIN) {
  if (!origin) return null;
  return `${origin}/?ios=1#/${route.replace(/^\//, "")}`;
}

export function isTrustedDevForgeNavigation(candidate: string, origin = DEVFORGE_ORIGIN) {
  if (!origin) return false;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return false;
    return url.origin === origin || url.hostname === "manus.im" || url.hostname.endsWith(".manus.im");
  } catch {
    return false;
  }
}
