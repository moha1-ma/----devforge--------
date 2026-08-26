export const DEVFORGE_ORIGIN = "https://devforge-acdjkepw.manus.space";

export type DevForgeRoute = "/" | "/ai" | "/website-studio" | "/code" | "/domains" | "/plans" | "/integrations";

export function makeWorkspaceUrl(route: DevForgeRoute) {
  return `${DEVFORGE_ORIGIN}/?ios=1#/${route.replace(/^\//, "")}`;
}
