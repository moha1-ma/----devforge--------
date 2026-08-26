export function isIosUserAgent(userAgent: string) {
  return /iPad|iPhone|iPod/.test(userAgent);
}

export function shouldShowIosInstallGuide(userAgent: string, isStandalone: boolean) {
  return isIosUserAgent(userAgent) && !isStandalone;
}
