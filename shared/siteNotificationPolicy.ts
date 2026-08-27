export const siteNotificationCategories = ["workspace", "community", "review", "system"] as const;
export type SiteNotificationCategory = (typeof siteNotificationCategories)[number];

export const siteNotificationLinks = ["/workspace", "/community-review", "/visitor-review", "/marketplace-review", "/mini-workstations", "/continuity"] as const;
export type SiteNotificationLink = (typeof siteNotificationLinks)[number];

export function isSiteNotificationLink(value: string | null | undefined): value is SiteNotificationLink {
  return Boolean(value && siteNotificationLinks.includes(value as SiteNotificationLink));
}

export function normalizeSiteNotification(input: { title: string; body: string; category: SiteNotificationCategory; link?: string | null }) {
  const title = input.title.trim().replace(/\s+/g, " ").slice(0, 180);
  const body = input.body.trim().replace(/\s+/g, " ").slice(0, 900);
  if (!title || !body) throw new Error("عنوان الإشعار ومحتواه مطلوبان.");
  if (input.link && !isSiteNotificationLink(input.link)) throw new Error("رابط الإشعار غير مسموح.");
  return { title, body, category: input.category, link: input.link ?? null };
}
