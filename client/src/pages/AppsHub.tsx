import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  appCategories,
  getCategoryLabel,
  getLocalizedApps,
  type AppCategory,
  type AppKey,
} from "@/lib/appRegistry";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpLeft,
  ChevronDown,
  ChevronUp,
  Clock3,
  Grid2X2,
  Pin,
  PinOff,
  Search,
  ShieldCheck,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// App directory page: lets a signed-in user search/filter every DevForge
// app, pin/reorder favorites, and jump back into recently opened apps.
export default function AppsHub() {
  const { language, direction } = useLanguage();
  const [, navigate] = useLocation();
  const apps = useMemo(
    () => getLocalizedApps(language).filter(app => app.key !== "apps"),
    [language]
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | AppCategory>("all");
  const preferencesQuery = trpc.appPreferences.list.useQuery();
  const utils = trpc.useUtils();

  const setPinned = trpc.appPreferences.setPinned.useMutation({
    onMutate: async input => {
      await utils.appPreferences.list.cancel();
      const previous = utils.appPreferences.list.getData();
      utils.appPreferences.list.setData(undefined, current => {
        const rows = current ?? [];
        const existing = rows.find(row => row.appKey === input.appKey);
        if (existing)
          return rows.map(row =>
            row.appKey === input.appKey
              ? { ...row, isPinned: input.isPinned }
              : row
          );
        return [
          ...rows,
          {
            id: -Date.now(),
            userId: 0,
            appKey: input.appKey,
            isPinned: input.isPinned,
            displayOrder: rows.length,
            lastOpenedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      utils.appPreferences.list.setData(undefined, context?.previous);
      toast.error(
        language === "ar" ? "تعذر حفظ التفضيل." : "Could not save preference."
      );
    },
    onSuccess: data => utils.appPreferences.list.setData(undefined, data),
  });

  const reorder = trpc.appPreferences.reorder.useMutation({
    onMutate: async input => {
      await utils.appPreferences.list.cancel();
      const previous = utils.appPreferences.list.getData();
      const order = new Map(
        input.appKeys.map((appKey, index) => [appKey, index])
      );
      utils.appPreferences.list.setData(undefined, current =>
        (current ?? []).map(row =>
          order.has(row.appKey)
            ? { ...row, isPinned: true, displayOrder: order.get(row.appKey)! }
            : row
        )
      );
      return { previous };
    },
    onSuccess: data => utils.appPreferences.list.setData(undefined, data),
    onError: (_error, _input, context) => {
      utils.appPreferences.list.setData(undefined, context?.previous);
      toast.error(
        language === "ar" ? "تعذر حفظ الترتيب." : "Could not save order."
      );
    },
  });
  const touch = trpc.appPreferences.touch.useMutation();
  const preferences = preferencesQuery.data ?? [];
  const preferenceByKey = new Map(
    preferences.map(preference => [preference.appKey, preference])
  );
  const pinned = apps
    .filter(app => preferenceByKey.get(app.key)?.isPinned)
    .sort(
      (a, b) =>
        (preferenceByKey.get(a.key)?.displayOrder ?? 0) -
        (preferenceByKey.get(b.key)?.displayOrder ?? 0)
    );
  const recent = apps
    .filter(app => preferenceByKey.get(app.key)?.lastOpenedAt)
    .sort(
      (a, b) =>
        Number(new Date(preferenceByKey.get(b.key)!.lastOpenedAt!)) -
        Number(new Date(preferenceByKey.get(a.key)!.lastOpenedAt!))
    )
    .slice(0, 6);
  const normalizedQuery = query
    .trim()
    .toLocaleLowerCase(language === "ar" ? "ar" : "en");
  const filtered = apps.filter(app => {
    if (category !== "all" && app.category !== category) return false;
    if (!normalizedQuery) return true;
    return `${app.title} ${app.summary} ${app.keywords.join(" ")}`
      .toLocaleLowerCase(language === "ar" ? "ar" : "en")
      .includes(normalizedQuery);
  });

  // Records the app as recently opened, then navigates to it.
  const openApp = (app: (typeof apps)[number]) => {
    touch.mutate({ appKey: app.key });
    navigate(app.path);
  };
  // Swaps a pinned app with its neighbor in the given direction and
  // persists the resulting pinned order.
  const movePinned = (appKey: AppKey, direction: -1 | 1) => {
    const index = pinned.findIndex(app => app.key === appKey);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= pinned.length) return;
    const keys = pinned.map(app => app.key);
    [keys[index], keys[nextIndex]] = [keys[nextIndex], keys[index]];
    reorder.mutate({ appKeys: keys });
  };

  return (
    <DashboardLayout>
      <section dir={direction} className="platform-page space-y-8">
        <header className="platform-page-header">
          <div>
            <p className="command-label">DEVFORGE / APP DIRECTORY</p>
            <h1 className="platform-page-title">
              {language === "ar" ? "مركز التطبيقات" : "App center"}
            </h1>
            <p className="platform-page-copy">
              {language === "ar"
                ? "كل مساحات العمل والأدوات في مكان واحد. ثبّت ما تستخدمه ورتّبه كما يناسب يومك."
                : "Every workspace and tool in one place. Pin what you use and arrange it around your day."}
            </p>
          </div>
          <div className="platform-status">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>
              {language === "ar"
                ? `${apps.length} تطبيقاً منظماً`
                : `${apps.length} organized apps`}
            </span>
          </div>
        </header>

        <div className="platform-toolbar">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={
                language === "ar"
                  ? "ابحث باسم التطبيق أو مهمته…"
                  : "Search by app or purpose…"
              }
              className="h-12 rounded-xl border-white/8 bg-black/15 ps-11 text-white placeholder:text-slate-600"
            />
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            aria-label={
              language === "ar" ? "تصنيفات التطبيقات" : "App categories"
            }
          >
            <Button
              type="button"
              variant={category === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategory("all")}
              className="shrink-0"
            >
              {language === "ar" ? "الكل" : "All"}
            </Button>
            {(Object.keys(appCategories) as AppCategory[]).map(key => (
              <Button
                key={key}
                type="button"
                variant={category === key ? "default" : "ghost"}
                size="sm"
                onClick={() => setCategory(key)}
                className="shrink-0"
              >
                {getCategoryLabel(key, language)}
              </Button>
            ))}
          </div>
        </div>

        {pinned.length > 0 && !normalizedQuery && category === "all" ? (
          <section aria-labelledby="pinned-apps">
            <div className="platform-section-heading">
              <div>
                <h2 id="pinned-apps">
                  {language === "ar" ? "المثبتة" : "Pinned"}
                </h2>
                <p>
                  {language === "ar"
                    ? "اختصاراتك المتزامنة مع الحساب."
                    : "Shortcuts synchronized with your account."}
                </p>
              </div>
              <Pin className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pinned.map((app, index) => (
                <article
                  key={app.key}
                  className="platform-card flex items-center gap-4 p-4"
                >
                  <button
                    type="button"
                    onClick={() => openApp(app)}
                    className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <span className="app-icon">
                      <app.Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-white">
                        {app.title}
                      </strong>
                      <span className="mt-1 block truncate text-xs text-slate-500">
                        {app.summary}
                      </span>
                    </span>
                  </button>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0 || reorder.isPending}
                      onClick={() => movePinned(app.key, -1)}
                      aria-label={
                        language === "ar"
                          ? `رفع ${app.title}`
                          : `Move ${app.title} up`
                      }
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={
                        index === pinned.length - 1 || reorder.isPending
                      }
                      onClick={() => movePinned(app.key, 1)}
                      aria-label={
                        language === "ar"
                          ? `خفض ${app.title}`
                          : `Move ${app.title} down`
                      }
                    >
                      <ChevronDown />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {recent.length > 0 && !normalizedQuery && category === "all" ? (
          <section aria-labelledby="recent-apps">
            <div className="platform-section-heading">
              <div>
                <h2 id="recent-apps">
                  {language === "ar" ? "المستخدمة حديثاً" : "Recently used"}
                </h2>
                <p>
                  {language === "ar"
                    ? "ارجع بسرعة إلى آخر مساحاتك."
                    : "Jump back into your latest workspaces."}
                </p>
              </div>
              <Clock3 className="h-4 w-4 text-violet-300" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recent.map(app => (
                <button
                  key={app.key}
                  type="button"
                  onClick={() => openApp(app)}
                  className="platform-card flex min-h-24 min-w-[16rem] items-center gap-4 p-4 text-start hover:border-violet-300/20"
                >
                  <span className="app-icon app-icon-violet">
                    <app.Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <strong className="block text-sm text-white">
                      {app.title}
                    </strong>
                    <span className="mt-1 block text-xs text-slate-500">
                      {getCategoryLabel(app.category, language)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="all-apps">
          <div className="platform-section-heading">
            <div>
              <h2 id="all-apps">
                {language === "ar" ? "كل التطبيقات" : "All apps"}
              </h2>
              <p>
                {language === "ar"
                  ? `${filtered.length} نتيجة ضمن العرض الحالي.`
                  : `${filtered.length} results in this view.`}
              </p>
            </div>
            <Grid2X2 className="h-4 w-4 text-slate-400" />
          </div>
          {filtered.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map(app => {
                const isPinned = Boolean(
                  preferenceByKey.get(app.key)?.isPinned
                );
                return (
                  <article
                    key={app.key}
                    className="platform-card group relative flex min-h-56 flex-col p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="app-icon">
                        <app.Icon className="h-5 w-5" />
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setPinned.mutate({
                            appKey: app.key,
                            isPinned: !isPinned,
                          })
                        }
                        aria-pressed={isPinned}
                        aria-label={
                          isPinned
                            ? language === "ar"
                              ? `إلغاء تثبيت ${app.title}`
                              : `Unpin ${app.title}`
                            : language === "ar"
                              ? `تثبيت ${app.title}`
                              : `Pin ${app.title}`
                        }
                        className={
                          isPinned
                            ? "text-cyan-200"
                            : "text-slate-600 hover:text-slate-200"
                        }
                      >
                        {isPinned ? <PinOff /> : <Pin />}
                      </Button>
                    </div>
                    <div className="mt-7 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        {getCategoryLabel(app.category, language)}
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-white">
                        {app.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {app.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openApp(app)}
                      className="mt-5 flex min-h-11 items-center justify-between rounded-xl border-t border-white/7 pt-4 text-sm font-semibold text-slate-300 transition group-hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <span>
                        {language === "ar" ? "فتح التطبيق" : "Open app"}
                      </span>
                      <ArrowUpLeft className="h-4 w-4" />
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="platform-empty">
              <Search className="h-6 w-6 text-slate-600" />
              <h3>
                {language === "ar"
                  ? "لا توجد تطبيقات مطابقة"
                  : "No matching apps"}
              </h3>
              <p>
                {language === "ar"
                  ? "غيّر عبارة البحث أو اختر تصنيفاً آخر."
                  : "Change the search phrase or choose another category."}
              </p>
            </div>
          )}
        </section>
      </section>
    </DashboardLayout>
  );
}
