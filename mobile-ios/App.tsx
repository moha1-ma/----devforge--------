import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { DEVFORGE_ORIGIN, isTrustedDevForgeNavigation, makeWorkspaceUrl, type DevForgeRoute } from "./lib/devforgeRoutes";
import { mobileHomeSections } from "./lib/homeSections";
import { createNativeBriefRecord, NATIVE_BRIEF_MAX_LENGTH, NATIVE_BRIEF_STORAGE_KEY, parseNativeBriefRecord } from "./lib/nativeBrief";
import { WEB_PREVIEW_TIMEOUT_MS, completePreview, failPreview, getPublishedFallbackLabel, retryPreview, startPreview } from "./lib/previewState";

type WorkspaceTarget = {
  title: string;
  subtitle: string;
  route: DevForgeRoute;
  accent: string;
  icon: string;
};

const quickAccess: WorkspaceTarget[] = [
  { title: "مساعد DevForge", subtitle: "اكتب المهمة واحصل على رد خاص داخل مساحتك.", route: "/ai", accent: "#37D6C0", icon: "AI" },
  { title: "أكاديمية البناء", subtitle: "اتبع خطة عملية لبناء موقع أو تطبيق أو API.", route: "/plans", accent: "#B79CFF", icon: "LEARN" },
  { title: "Website Studio", subtitle: "ابدأ مشروع موقع من موجز عربي وعدّل ملفاته.", route: "/website-studio", accent: "#7E9CFF", icon: "WEB" },
  { title: "مساحة الكود", subtitle: "افتح ملفات مشاريعك الخاصة داخل DevForge.", route: "/code", accent: "#F4B860", icon: "CODE" },
  { title: "معرض النطاقات", subtitle: "راجع 20 اسمًا مقترحًا قبل التحقق لدى المسجّل.", route: "/domains", accent: "#D787FF", icon: "DNS" },
  { title: "مركز التكاملات", subtitle: "راجع المنصات وحدود التفويض دون ربط تلقائي.", route: "/integrations", accent: "#74D9A9", icon: "LINK" },
];

export default function App() {
  const [activeTarget, setActiveTarget] = useState<WorkspaceTarget | null>(null);
  const [preview, setPreview] = useState(() => startPreview());
  const workspaceUrl = useMemo(() => (activeTarget ? makeWorkspaceUrl(activeTarget.route) : null), [activeTarget]);
  const [nativeBrief, setNativeBrief] = useState("");
  const [briefStatus, setBriefStatus] = useState("يُحفظ هذا الموجز على جهازك فقط.");
  const [isBriefReady, setIsBriefReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(NATIVE_BRIEF_STORAGE_KEY)
      .then((value) => {
        const record = parseNativeBriefRecord(value);
        if (!isMounted || !record) return;
        setNativeBrief(record.content);
        setBriefStatus("تمت استعادة موجزك المحلي. لن يُرسل إلى DevForge إلا إذا اخترت نسخه أو إدخاله بنفسك.");
      })
      .catch(() => {
        if (isMounted) setBriefStatus("تعذر قراءة الموجز المحلي. يمكنك متابعة العمل دون حفظه.");
      })
      .finally(() => {
        if (isMounted) setIsBriefReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeTarget || !workspaceUrl || !preview.loading) return;
    const timeout = setTimeout(() => setPreview((current) => current.loading ? failPreview(current, "timeout") : current), WEB_PREVIEW_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [activeTarget, preview.attempt, preview.loading, workspaceUrl]);

  const saveNativeBrief = async () => {
    const result = createNativeBriefRecord(nativeBrief);
    if (!result.ok) {
      setBriefStatus(result.message);
      return;
    }

    try {
      await AsyncStorage.setItem(NATIVE_BRIEF_STORAGE_KEY, JSON.stringify(result.record));
      setNativeBrief(result.record.content);
      setBriefStatus("تم حفظ موجزك على هذا الجهاز فقط.");
    } catch {
      setBriefStatus("تعذر الحفظ المحلي. لم يُرسل أي محتوى إلى الإنترنت.");
    }
  };

  const clearNativeBrief = () => {
    Alert.alert("حذف الموجز المحلي", "سيُحذف من هذا الجهاز فقط ولا يمكن استعادته من التطبيق.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => {
          void AsyncStorage.removeItem(NATIVE_BRIEF_STORAGE_KEY)
            .then(() => {
              setNativeBrief("");
              setBriefStatus("تم حذف الموجز المحلي من هذا الجهاز.");
            })
            .catch(() => setBriefStatus("تعذر حذف الموجز المحلي. لم يُرسل أي محتوى إلى الإنترنت."));
        },
      },
    ]);
  };

  const openTarget = (target: WorkspaceTarget) => {
    if (!DEVFORGE_ORIGIN) {
      Alert.alert("يتطلب رابطًا منشورًا", "اربط التطبيق بعنوان HTTPS الخاص بهذه النسخة من DevForge عبر EXPO_PUBLIC_DEVFORGE_ORIGIN قبل فتح مساحة العمل.");
      return;
    }
    setPreview((current) => startPreview(current.attempt));
    setActiveTarget(target);
  };
  const returnToHome = () => { setActiveTarget(null); setPreview((current) => completePreview(current)); };
  const retryWorkspace = () => setPreview((current) => retryPreview(current));
  const openPublishedWorkspace = () => {
    if (!workspaceUrl) return;
    void Linking.openURL(workspaceUrl).catch(() => Alert.alert("تعذر فتح الرابط", "تعذر فتح رابط DevForge المنشور. يمكنك إعادة المحاولة من داخل التطبيق."));
  };

  if (activeTarget && workspaceUrl) {
    return (
      <SafeAreaView style={styles.workspaceScreen}>
        <StatusBar style="light" />
        <View style={styles.workspaceHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="العودة إلى لوحة DevForge" onPress={returnToHome} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backButtonText}>العودة</Text>
          </Pressable>
          <View style={styles.workspaceHeading}>
            <Text style={styles.workspaceTitle}>{activeTarget.title}</Text>
            <Text style={styles.workspaceSubtitle}>جلسة آمنة ضمن DevForge</Text>
          </View>
        </View>
        <View style={styles.webViewFrame}>
          {preview.error ? <View style={styles.webFailure}><Text style={styles.webFailureTitle}>تعذر إكمال المعاينة</Text><Text style={styles.webErrorText}>{preview.error}</Text><Text style={styles.webFallbackText}>إذا استمر التعذر، يمكنك فتح رابط الإنتاج الرسمي بنفسك. لن يفتح التطبيق أي موقع تلقائيًا.</Text><View style={styles.webFailureActions}><Pressable accessibilityRole="button" accessibilityLabel="إعادة محاولة المعاينة" onPress={retryWorkspace} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryButtonText}>إعادة المحاولة</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="فتح رابط DevForge المنشور" onPress={openPublishedWorkspace} style={({ pressed }) => [styles.publishedButton, pressed && styles.pressed]}><Text style={styles.publishedButtonText}>{getPublishedFallbackLabel()}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="العودة إلى لوحة DevForge" onPress={returnToHome} style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}><Text style={styles.returnButtonText}>العودة</Text></Pressable></View></View> : <WebView
            key={preview.attempt}
            source={{ uri: workspaceUrl }}
            originWhitelist={["https://*", "http://*"]}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webLoading}>
                <ActivityIndicator color="#37D6C0" size="large" />
                <Text style={styles.webLoadingText}>يتم فتح مساحة DevForge الآمنة…</Text>
              </View>
            )}
            onLoadStart={() => {
              setPreview((current) => startPreview(current.attempt));
            }}
            onLoadEnd={() => setPreview((current) => completePreview(current))}
            onError={() => {
              setPreview((current) => failPreview(current, "network"));
            }}
            onShouldStartLoadWithRequest={(request) => {
              const isAllowed = isTrustedDevForgeNavigation(request.url);
              if (!isAllowed) Alert.alert("رابط غير موثوق", "يسمح التطبيق فقط بمنصة DevForge المحددة وصفحات تسجيل الدخول الرسمية.");
              return isAllowed;
            }}
          />}
          {preview.loading ? <View pointerEvents="none" style={styles.loadingLine} /> : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>DF</Text></View>
          <View><Text style={styles.brandTitle}>DevForge</Text><Text style={styles.brandCaption}>تطبيقك المرافق على iPhone</Text></View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>مساحتك الخاصة</Text>
          <Text style={styles.heroTitle}>ابنِ مشروعك من هاتفك.</Text>
          <Text style={styles.heroDescription}>افتح أدوات DevForge في تجربة متوافقة مع الهاتف، ثم سجّل الدخول داخل صفحة المنصة الرسمية فقط.</Text>
          <Pressable accessibilityRole="button" onPress={() => openTarget({ title: "لوحة DevForge", subtitle: "مساحتك الخاصة", route: "/", accent: "#37D6C0", icon: "DF" })} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>فتح مساحة العمل</Text><Text style={styles.primaryButtonArrow}>←</Text>
          </Pressable>
        </View>

        {!DEVFORGE_ORIGIN ? <View style={styles.configurationNotice}><Text style={styles.configurationNoticeTitle}>يلزم ربط النسخة المنشورة</Text><Text style={styles.configurationNoticeText}>هذه النسخة المستقلة لا تتصل بأي مشروع آخر. قبل الاختبار أو الإرسال، حدّد رابط HTTPS الخاص بها في إعداد البناء.</Text></View> : null}

        <View style={styles.nativeBriefPanel}>
          <Text style={styles.panelEyebrow}>أداة iPhone أصلية</Text>
          <Text style={styles.panelTitle}>موجز البناء الخاص بك</Text>
          <Text style={styles.panelText}>دوّن هدفك أو خطوتك التالية على الهاتف. يبقى النص محليًا على جهازك ولا يُرسل تلقائيًا إلى المنصة أو أي خدمة أخرى.</Text>
          <TextInput
            accessibilityLabel="موجز البناء المحلي"
            editable={isBriefReady}
            maxLength={NATIVE_BRIEF_MAX_LENGTH}
            multiline
            onChangeText={(value) => {
              setNativeBrief(value);
              setBriefStatus("يُحفظ هذا الموجز على جهازك فقط.");
            }}
            placeholder="مثال: جهّز صفحة تعريف عربية لمشروع العميل"
            placeholderTextColor="#7897AA"
            style={styles.nativeBriefInput}
            textAlignVertical="top"
            value={nativeBrief}
          />
          <Text style={styles.nativeBriefCount}>{nativeBrief.length}/{NATIVE_BRIEF_MAX_LENGTH}</Text>
          <Text style={styles.nativeBriefStatus}>{isBriefReady ? briefStatus : "يتم تجهيز مساحة الحفظ المحلية…"}</Text>
          <View style={styles.nativeBriefActions}>
            <Pressable accessibilityRole="button" disabled={!isBriefReady} onPress={() => void saveNativeBrief()} style={({ pressed }) => [styles.nativeBriefSave, pressed && styles.pressed, !isBriefReady && styles.disabledButton]}><Text style={styles.nativeBriefSaveText}>حفظ على الهاتف</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={!isBriefReady || !nativeBrief} onPress={clearNativeBrief} style={({ pressed }) => [styles.nativeBriefClear, pressed && styles.pressed, (!isBriefReady || !nativeBrief) && styles.disabledButton]}><Text style={styles.nativeBriefClearText}>حذف</Text></Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>تعلم وابنِ</Text><Text style={styles.sectionHint}>6 أدوات</Text></View>
        <View style={styles.cardGrid}>
          {quickAccess.map((target) => (
            <Pressable accessibilityRole="button" accessibilityLabel={`فتح ${target.title}`} key={target.route} onPress={() => openTarget(target)} style={({ pressed }) => [styles.toolCard, pressed && styles.pressed]}>
              <View style={[styles.toolIcon, { backgroundColor: target.accent }]}><Text style={styles.toolIconText}>{target.icon}</Text></View>
              <Text style={styles.toolTitle}>{target.title}</Text><Text style={styles.toolSubtitle}>{target.subtitle}</Text><Text style={styles.toolOpen}>فتح ←</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.educationPanel}>
          <Text style={styles.panelEyebrow}>{mobileHomeSections.education.eyebrow}</Text>
          <Text style={styles.panelTitle}>{mobileHomeSections.education.title}</Text>
          <Text style={styles.panelText}>{mobileHomeSections.education.description}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="فتح أكاديمية البناء" onPress={() => openTarget({ title: mobileHomeSections.education.targetTitle, subtitle: mobileHomeSections.education.targetSubtitle, route: mobileHomeSections.education.route, accent: mobileHomeSections.education.accent, icon: mobileHomeSections.education.icon })} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>{mobileHomeSections.education.action}</Text><Text style={styles.secondaryButtonArrow}>←</Text>
          </Pressable>
        </View>

        <View style={styles.marketPanel}>
          <Text style={styles.panelEyebrow}>{mobileHomeSections.marketplace.eyebrow}</Text>
          <Text style={styles.panelTitle}>{mobileHomeSections.marketplace.title}</Text>
          <Text style={styles.panelText}>{mobileHomeSections.marketplace.description}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="فتح معرض النطاقات والمواقع" onPress={() => openTarget({ title: mobileHomeSections.marketplace.targetTitle, subtitle: mobileHomeSections.marketplace.targetSubtitle, route: mobileHomeSections.marketplace.route, accent: mobileHomeSections.marketplace.accent, icon: mobileHomeSections.marketplace.icon })} style={({ pressed }) => [styles.marketButton, pressed && styles.pressed]}>
            <Text style={styles.marketButtonText}>{mobileHomeSections.marketplace.action}</Text><Text style={styles.marketButtonArrow}>←</Text>
          </Pressable>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>الخصوصية أولًا</Text>
          <Text style={styles.noticeText}>لا يخزن هذا التطبيق كلمة مرورك أو رمز المالك أو مفاتيح الخدمات. تسجيل الدخول يبقى ضمن صفحة DevForge الآمنة. أدوات JavaScript التشخيصية وأي اقتران طرفية مستقبلي تخص المالك ولا تمنح تحكمًا دائمًا في هاتفك.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#071A2B" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 38 },
  brandRow: { alignItems: "center", flexDirection: "row-reverse", gap: 11 },
  brandMark: { alignItems: "center", backgroundColor: "#37D6C0", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  brandMarkText: { color: "#071A2B", fontSize: 14, fontWeight: "900" },
  brandTitle: { color: "#F5FAFF", fontSize: 20, fontWeight: "800", textAlign: "right" },
  brandCaption: { color: "#9FB3C8", fontSize: 12, marginTop: 2, textAlign: "right" },
  hero: { backgroundColor: "#0D2840", borderColor: "#1A415C", borderRadius: 24, borderWidth: 1, marginTop: 26, padding: 22 },
  eyebrow: { color: "#37D6C0", fontSize: 13, fontWeight: "800", textAlign: "right" },
  heroTitle: { color: "#F5FAFF", fontSize: 30, fontWeight: "900", lineHeight: 39, marginTop: 8, textAlign: "right" },
  heroDescription: { color: "#C5D5E4", fontSize: 15, lineHeight: 24, marginTop: 10, textAlign: "right" },
  primaryButton: { alignItems: "center", backgroundColor: "#37D6C0", borderRadius: 14, flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 20, paddingHorizontal: 17, paddingVertical: 15 },
  primaryButtonText: { color: "#071A2B", fontSize: 16, fontWeight: "900" },
  primaryButtonArrow: { color: "#071A2B", fontSize: 21, fontWeight: "800" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  sectionHeader: { alignItems: "center", flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 12, marginTop: 28 },
  sectionTitle: { color: "#F5FAFF", fontSize: 19, fontWeight: "800", textAlign: "right" },
  sectionHint: { color: "#8FA8BF", fontSize: 13 },
  cardGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  toolCard: { backgroundColor: "#0B2237", borderColor: "#183D57", borderRadius: 18, borderWidth: 1, minHeight: 208, padding: 16, width: "48%" },
  toolIcon: { alignItems: "center", borderRadius: 9, height: 34, justifyContent: "center", marginBottom: 14, width: 48 },
  toolIconText: { color: "#071A2B", fontSize: 10, fontWeight: "900" },
  toolTitle: { color: "#F5FAFF", fontSize: 15, fontWeight: "800", lineHeight: 21, textAlign: "right" },
  toolSubtitle: { color: "#9FB3C8", fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: "right" },
  toolOpen: { color: "#37D6C0", fontSize: 12, fontWeight: "800", marginTop: "auto", paddingTop: 10, textAlign: "right" },
  notice: { backgroundColor: "#0A2437", borderLeftColor: "#37D6C0", borderLeftWidth: 3, borderRadius: 14, marginTop: 22, padding: 16 },
  noticeTitle: { color: "#E2F7F3", fontSize: 14, fontWeight: "800", textAlign: "right" },
  noticeText: { color: "#B8CDDE", fontSize: 12, lineHeight: 19, marginTop: 6, textAlign: "right" },
  educationPanel: { backgroundColor: "#14263F", borderColor: "#564888", borderRadius: 20, borderWidth: 1, marginTop: 22, padding: 18 },
  marketPanel: { backgroundColor: "#14263F", borderColor: "#3E6A7C", borderRadius: 20, borderWidth: 1, marginTop: 14, padding: 18 },
  panelEyebrow: { color: "#8FE9DC", fontSize: 12, fontWeight: "800", textAlign: "right" },
  panelTitle: { color: "#F5FAFF", fontSize: 18, fontWeight: "900", lineHeight: 26, marginTop: 6, textAlign: "right" },
  panelText: { color: "#B8CDDE", fontSize: 13, lineHeight: 21, marginTop: 8, textAlign: "right" },
  secondaryButton: { alignItems: "center", backgroundColor: "#B79CFF", borderRadius: 12, flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 16, paddingHorizontal: 14, paddingVertical: 12 },
  secondaryButtonText: { color: "#16102B", fontSize: 14, fontWeight: "900" },
  secondaryButtonArrow: { color: "#16102B", fontSize: 18, fontWeight: "800" },
  marketButton: { alignItems: "center", backgroundColor: "#2F8BB0", borderRadius: 12, flexDirection: "row-reverse", justifyContent: "space-between", marginTop: 16, paddingHorizontal: 14, paddingVertical: 12 },
  marketButtonText: { color: "#F5FAFF", fontSize: 14, fontWeight: "900" },
  marketButtonArrow: { color: "#F5FAFF", fontSize: 18, fontWeight: "800" },
  workspaceScreen: { backgroundColor: "#071A2B", flex: 1 },
  workspaceHeader: { alignItems: "center", backgroundColor: "#0B2237", borderBottomColor: "#183D57", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 64, paddingHorizontal: 16 },
  backButton: { backgroundColor: "#163751", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  backButtonText: { color: "#E6F2FA", fontSize: 13, fontWeight: "800" },
  workspaceHeading: { alignItems: "flex-end", flex: 1, marginLeft: 14 },
  workspaceTitle: { color: "#F5FAFF", fontSize: 15, fontWeight: "800", textAlign: "right" },
  workspaceSubtitle: { color: "#9FB3C8", fontSize: 11, marginTop: 2, textAlign: "right" },
  webViewFrame: { backgroundColor: "#071A2B", flex: 1 },
  webLoading: { alignItems: "center", backgroundColor: "#071A2B", flex: 1, gap: 14, justifyContent: "center" },
  webLoadingText: { color: "#C5D5E4", fontSize: 14 },
  loadingLine: { backgroundColor: "#37D6C0", height: 3, left: 0, position: "absolute", right: 0, top: 0 },
  webFailure: { alignItems: "stretch", backgroundColor: "#0B2237", flex: 1, justifyContent: "center", padding: 24 },
  webFailureTitle: { color: "#F5FAFF", fontSize: 20, fontWeight: "900", textAlign: "right" },
  webErrorText: { color: "#FFE7EF", fontSize: 13, lineHeight: 20, textAlign: "right" },
  webFailureActions: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 10, marginTop: 20 },
  webFallbackText: { color: "#B8CDDE", fontSize: 12, lineHeight: 19, marginTop: 10, textAlign: "right" },
  retryButton: { alignItems: "center", backgroundColor: "#37D6C0", borderRadius: 12, flex: 1, paddingVertical: 13 },
  retryButtonText: { color: "#06242C", fontSize: 14, fontWeight: "900" },
  publishedButton: { alignItems: "center", backgroundColor: "#284A68", borderColor: "#4E83A7", borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 13 },
  publishedButtonText: { color: "#E1F2FF", fontSize: 13, fontWeight: "900" },
  returnButton: { alignItems: "center", borderColor: "#51828A", borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 13 },
  returnButtonText: { color: "#D8EFF1", fontSize: 14, fontWeight: "800" },
  configurationNotice: { backgroundColor: "#183449", borderColor: "#3C6C83", borderRadius: 16, borderWidth: 1, marginTop: 20, padding: 16 },
  configurationNoticeTitle: { color: "#DFF8FF", fontSize: 14, fontWeight: "900", textAlign: "right" },
  configurationNoticeText: { color: "#B9D5E2", fontSize: 13, lineHeight: 21, marginTop: 6, textAlign: "right" },
  nativeBriefPanel: { backgroundColor: "#103541", borderColor: "#2E7A7E", borderRadius: 20, borderWidth: 1, marginTop: 20, padding: 18 },
  nativeBriefInput: { backgroundColor: "#082633", borderColor: "#2A5C68", borderRadius: 12, borderWidth: 1, color: "#F5FAFF", fontSize: 14, lineHeight: 21, marginTop: 14, minHeight: 96, padding: 12, textAlign: "right" },
  nativeBriefCount: { color: "#91B9C3", fontSize: 11, marginTop: 6, textAlign: "left" },
  nativeBriefStatus: { color: "#C8E6E7", fontSize: 12, lineHeight: 19, marginTop: 8, textAlign: "right" },
  nativeBriefActions: { flexDirection: "row-reverse", gap: 10, marginTop: 14 },
  nativeBriefSave: { alignItems: "center", backgroundColor: "#37D6C0", borderRadius: 11, flex: 1, paddingVertical: 12 },
  nativeBriefSaveText: { color: "#06242C", fontSize: 13, fontWeight: "900" },
  nativeBriefClear: { alignItems: "center", borderColor: "#51828A", borderRadius: 11, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 12 },
  nativeBriefClearText: { color: "#D8EFF1", fontSize: 13, fontWeight: "800" },
  disabledButton: { opacity: 0.45 },
});
