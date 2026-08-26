import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { DEVFORGE_ORIGIN, isTrustedDevForgeNavigation, makeWorkspaceUrl, type DevForgeRoute } from "./lib/devforgeRoutes";
import { mobileHomeSections } from "./lib/homeSections";

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
  const [isLoading, setIsLoading] = useState(true);
  const [webError, setWebError] = useState<string | null>(null);
  const workspaceUrl = useMemo(() => (activeTarget ? makeWorkspaceUrl(activeTarget.route) : null), [activeTarget]);

  const openTarget = (target: WorkspaceTarget) => {
    if (!DEVFORGE_ORIGIN) {
      Alert.alert("يتطلب رابطًا منشورًا", "اربط التطبيق بعنوان HTTPS الخاص بهذه النسخة من DevForge عبر EXPO_PUBLIC_DEVFORGE_ORIGIN قبل فتح مساحة العمل.");
      return;
    }
    setWebError(null);
    setIsLoading(true);
    setActiveTarget(target);
  };

  if (activeTarget && workspaceUrl) {
    return (
      <SafeAreaView style={styles.workspaceScreen}>
        <StatusBar style="light" />
        <View style={styles.workspaceHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="العودة إلى لوحة DevForge" onPress={() => setActiveTarget(null)} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backButtonText}>العودة</Text>
          </Pressable>
          <View style={styles.workspaceHeading}>
            <Text style={styles.workspaceTitle}>{activeTarget.title}</Text>
            <Text style={styles.workspaceSubtitle}>جلسة آمنة ضمن DevForge</Text>
          </View>
        </View>
        <View style={styles.webViewFrame}>
          <WebView
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
              setWebError(null);
              setIsLoading(true);
            }}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setWebError("تعذر فتح منصة DevForge. تحقق من اتصالك ومن أن الرابط المنشور صحيح، ثم حاول مرة أخرى.");
            }}
            onShouldStartLoadWithRequest={(request) => {
              const isAllowed = isTrustedDevForgeNavigation(request.url);
              if (!isAllowed) Alert.alert("رابط غير موثوق", "يسمح التطبيق فقط بمنصة DevForge المحددة وصفحات تسجيل الدخول الرسمية.");
              return isAllowed;
            }}
          />
          {isLoading ? <View pointerEvents="none" style={styles.loadingLine} /> : null}
          {webError ? <View style={styles.webError}><Text style={styles.webErrorText}>{webError}</Text></View> : null}
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
          <Text style={styles.noticeText}>لا يخزن هذا التطبيق كلمة مرورك أو رمز المالك أو مفاتيح الخدمات. تسجيل الدخول يبقى ضمن صفحة DevForge الآمنة.</Text>
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
  webError: { backgroundColor: "#3A1730", borderColor: "#CA668F", borderRadius: 12, borderWidth: 1, bottom: 18, left: 18, padding: 14, position: "absolute", right: 18 },
  webErrorText: { color: "#FFE7EF", fontSize: 13, lineHeight: 20, textAlign: "right" },
  configurationNotice: { backgroundColor: "#183449", borderColor: "#3C6C83", borderRadius: 16, borderWidth: 1, marginTop: 20, padding: 16 },
  configurationNoticeTitle: { color: "#DFF8FF", fontSize: 14, fontWeight: "900", textAlign: "right" },
  configurationNoticeText: { color: "#B9D5E2", fontSize: 13, lineHeight: 21, marginTop: 6, textAlign: "right" },
});
