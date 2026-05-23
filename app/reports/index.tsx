import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OfflineBanner } from "@/components/OfflineBanner";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Fonts, Palette, arDigits } from "@/constants/theme";
import { useSalesOrders } from "@/features/sales/sales.hooks";

type StatItem = {
  label: string;
  value: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  up?: boolean;
};

type Report = {
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  href: Href;
};

const REPORTS: Report[] = [
  {
    title: "المنتجات المطلوبة حسب \n الكمية والتعبئة",
    sub: "تجميع المنتجات حسب الوحدة، الكيس، الكرتون، والطن",
    icon: "cube-outline",
    accent: Palette.greenDk,
    href: "/reports/products-by-qty",
  },
  {
    title: "الطلبات مرتبة حسب التاريخ",
    sub: "عرض زمني للطلبات يوميًا وأسبوعيًا",
    icon: "calendar-outline",
    accent: Palette.green,
    href: "/reports/orders-by-date",
  },
  {
    title: "الطلبات عبر الزمن",
    sub: "تطور حجم الطلبات والاتجاه الشهري",
    icon: "trending-up-outline",
    accent: Palette.cardB,
    href: "/reports/orders-trend",
  },
];

function useSummaryStats(): {
  stats: StatItem[];
  isLoading: boolean;
  isError: boolean;
} {
  // Fetch a large recent slice and aggregate client-side. For larger datasets,
  // replace with a Postgres view / RPC like `sales_summary()`.
  const orders = useSalesOrders({ limit: 500 });

  const stats = useMemo<StatItem[]>(() => {
    const list = orders.data ?? [];
    const total = list.length;
    const weekAgo = Date.now() - 7 * 86400000;
    const thisWeek = list.filter(
      (o) => new Date(o.created_at).getTime() >= weekAgo,
    ).length;
    const delivered = list.filter((o) => o.status === "c").length;

    return [
      {
        label: "إجمالي الطلبات",
        value: arDigits(total),
        hint: arDigits(total),
        icon: "document-text-outline",
      },
      {
        label: "هذا الأسبوع",
        value: arDigits(thisWeek),
        hint: arDigits(
          `${total > 0 ? Math.round((thisWeek / total) * 100) : 0}%`,
        ),
        icon: "trending-up-outline",
        up: thisWeek > 0,
      },
      {
        label: "تم التسليم",
        value: arDigits(delivered),
        hint:
          total > 0
            ? arDigits(`${Math.round((delivered / total) * 100)}%`)
            : "—",
        icon: "checkmark-done-outline",
      },
    ];
  }, [orders.data]);

  return { stats, isLoading: orders.isLoading, isError: orders.isError };
}

function SummaryCard() {
  const { stats, isLoading, isError } = useSummaryStats();

  return (
    <View style={cs.card}>
      <View style={cs.headRow}>
        <View>
          <Text style={cs.eyebrow}>نظرة عامة</Text>
          <Text style={cs.title}>ملخص الأداء</Text>
        </View>
        <View style={cs.live}>
          <View style={cs.liveDot} />
          <Text style={cs.liveTxt}>مباشر</Text>
        </View>
      </View>
      <View style={cs.divider} />
      {isLoading ? (
        <View style={cs.center}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : isError ? (
        <Text style={cs.error}>تعذر تحميل الإحصائيات</Text>
      ) : (
        <View style={cs.statsRow}>
          {stats.map((s, i) => (
            <View
              key={s.label}
              style={[cs.stat, i < stats.length - 1 && cs.statBorder]}
            >
              <View style={cs.statIcon}>
                <Ionicons name={s.icon} size={16} color="#fff" />
              </View>
              <Text style={cs.statValue}>{s.value}</Text>
              <Text style={cs.statLabel}>{s.label}</Text>
              <Text style={[cs.statHint, s.up && cs.statHintUp]}>{s.hint}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  card: {
    marginHorizontal: 22,
    marginTop: 12,
    borderRadius: 24,
    padding: 18,
    backgroundColor: Palette.greenDk,
    shadowColor: "#1d3f2a",
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: Fonts.arabicMedium,
  },
  title: {
    fontSize: 20,
    color: "#fff",
    fontFamily: Fonts.arabicBold,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  live: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.22)",
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#a8e0a8" },
  liveTxt: { fontSize: 11, color: "#fff", fontFamily: Fonts.arabicBold },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginTop: 14,
    marginHorizontal: -18,
  },
  statsRow: { flexDirection: "row" },
  stat: { flex: 1, padding: 14, alignItems: "flex-start", gap: 6 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.12)" },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 22,
    color: "#fff",
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.78)",
    fontFamily: Fonts.arabicMedium,
  },
  statHint: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontFamily: Fonts.arabicBold,
  },
  statHintUp: { color: "#a8e0a8" },
  center: { paddingVertical: 28, alignItems: "center" },
  error: {
    padding: 16,
    textAlign: "center",
    color: "#ffd1c8",
    fontFamily: Fonts.arabicMedium,
    fontSize: 12,
  },
});

function ReportRow({ idx, r }: { idx: number; r: Report }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [
        ls.row,
        idx > 0 && ls.rowDivider,
        pressed && { opacity: 0.85 },
      ]}
      onPress={() => router.push(r.href)}
    >
      <View style={[ls.icon, { backgroundColor: r.accent }]}>
        <Ionicons name={r.icon} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={ls.titleRow}>
          <View style={ls.num}>
            <Text style={ls.numTxt}>{arDigits(idx + 1)}</Text>
          </View>
          <Text style={ls.title}>{r.title}</Text>
        </View>
        <Text style={ls.sub}>{r.sub}</Text>
      </View>
      <Ionicons
        name="chevron-back"
        size={14}
        color={Palette.ink}
        style={{ opacity: 0.55 }}
      />
    </Pressable>
  );
}

const ls = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.lineStrong },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  num: {
    backgroundColor: "rgba(45,90,63,0.10)",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
  },
  numTxt: { fontSize: 11, color: Palette.green, fontFamily: Fonts.arabicBold },
  title: {
    fontSize: 15,
    color: Palette.ink,
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  sub: {
    fontSize: 11,
    color: Palette.inkSoft,
    marginTop: 4,
    fontFamily: Fonts.arabic,
    lineHeight: 16,
  },
});

export default function ReportsScreen() {
  return (
    <Screen>
      <OfflineBanner />
      <ScreenHeader eyebrow="التحليلات" title="التقارير" trailing="share" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        <SummaryCard />
        <View style={out.wrap}>
          <View style={out.titleRow}>
            <Text style={out.title}>التقارير المتاحة</Text>
            <Text style={out.count}>{arDigits(REPORTS.length)} تقارير</Text>
          </View>
          <View style={out.card}>
            {REPORTS.map((r, i) => (
              <ReportRow key={r.title} idx={i} r={r} />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const out = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 18 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    color: Palette.ink,
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.3,
  },
  count: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    overflow: "hidden",
  },
});
