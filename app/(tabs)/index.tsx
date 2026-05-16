import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { OfflineBanner } from "@/components/OfflineBanner";
import { ReviewsModal } from "@/components/ReviewsModal";
import { Screen } from "@/components/Screen";
import {
  Fonts,
  Palette,
  arDigits,
  arMonths,
  arWeekdaysShort,
} from "@/constants/theme";
import { OrderRow } from "@/features/sales/components/OrderRow";
import { useSalesOrders } from "@/features/sales/sales.hooks";
import { useAuthStore } from "@/stores/auth";
import { useNotificationsStore } from "@/stores/notifications";

const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function Header() {
  const router = useRouter();
  const email = useAuthStore((s) => s.user?.email ?? "");
  const initial = (email.trim().charAt(0) || "?").toUpperCase();
  const count = useNotificationsStore((s) => s.newOrderIds.length);
  const clear = useNotificationsStore((s) => s.clear);
  const onBell = () => {
    clear();
    router.push({ pathname: "/orders", params: { date: toISODate(TODAY) } });
  };
  return (
    <View style={hs.row}>
      <View style={hs.left}>
        <View style={hs.avatar}>
          <Text style={hs.avatarTxt}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hs.eyebrow}>مرحبًا ✦</Text>
          <Text style={hs.name} numberOfLines={1}>
            {email || "—"}
          </Text>
        </View>
      </View>
      <Pressable style={hs.bell} hitSlop={8} onPress={onBell}>
        <Ionicons name="notifications-outline" size={20} color={Palette.ink} />
        {count > 0 && (
          <View style={hs.badge}>
            <Text style={hs.badgeTxt}>
              {count > 99 ? "99+" : arDigits(count)}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const hs = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 4,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.cardB,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1f3326",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarTxt: {
    color: Palette.greenDk,
    fontFamily: Fonts.arabicBold,
    fontSize: 14,
  },
  eyebrow: {
    fontSize: 12,
    color: Palette.inkSoft,
    fontFamily: Fonts.arabicMedium,
  },
  name: {
    fontSize: 14,
    color: Palette.ink,
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.2,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1f3326",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#c0392b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeTxt: {
    color: "#fff",
    fontSize: 10,
    fontFamily: Fonts.arabicBold,
    lineHeight: 12,
  },
});

function HorizontalCalendar({
  selected,
  onSelect,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
}) {
  const days = useMemo(() => {
    const arr: Date[] = [];
    const jan1 = new Date(TODAY.getFullYear(), 0, 1);
    for (let d = new Date(TODAY); d >= jan1; d.setDate(d.getDate() - 1)) {
      arr.push(new Date(d));
    }
    return arr;
  }, []);

  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    // Today is days[0]; under RTL it's the leading edge — keep offset 0.
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, []);

  return (
    <View style={cs.wrap}>
      <View style={cs.titleRow}>
        <Text style={cs.title}>
          {arMonths[selected.getMonth()]}{" "}
          <Text style={cs.year}>{arDigits(selected.getFullYear())}</Text>
        </Text>
        <View style={cs.todayBadge}>
          <View style={cs.dot} />
          <Text style={cs.todayTxt}>اليوم</Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={cs.strip}
      >
        {days.map((d, i) => {
          const sel = isSame(d, selected);
          const tday = isSame(d, TODAY);
          return (
            <Pressable
              key={i}
              onPress={() => onSelect(d)}
              style={[cs.day, sel && cs.daySel]}
            >
              <Text style={[cs.dayWk, sel && cs.dayWkSel]}>
                {arWeekdaysShort[d.getDay()]}
              </Text>
              <Text style={[cs.dayNum, sel && cs.dayNumSel]}>
                {arDigits(d.getDate())}
              </Text>
              {tday && <View style={[cs.todayPip, sel && cs.todayPipSel]} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 14 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    color: Palette.ink,
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.4,
  },
  year: { color: Palette.green },
  todayBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.green },
  todayTxt: {
    fontSize: 12,
    color: Palette.inkSoft,
    fontFamily: Fonts.arabicBold,
  },
  strip: { gap: 8, paddingBottom: 6, paddingHorizontal: 2 },
  day: {
    width: 52,
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  daySel: {
    backgroundColor: Palette.green,
    shadowColor: "#2d5a3f",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  dayWk: {
    fontSize: 12,
    color: Palette.ink,
    fontFamily: Fonts.arabicBold,
    opacity: 0.6,
  },
  dayWkSel: { color: "#fff", opacity: 0.85 },
  dayNum: {
    fontSize: 20,
    color: Palette.ink,
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.4,
  },
  dayNumSel: { color: "#fff" },
  todayPip: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.green,
  },
  todayPipSel: { backgroundColor: "#fff" },
});

function NewOrderCard() {
  const router = useRouter();
  return (
    <View style={ns.card}>
      <View style={ns.logoWrap}>
        <Image
          source={require("@/assets/images/logo.jpg")}
          style={ns.logoImg}
          resizeMode="cover"
        />
      </View>
      <View style={ns.body}>
        <Text style={ns.title}>طلب مبيعات جديد</Text>
        <Pressable style={ns.cta} onPress={() => router.push("/orders/new")}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={ns.ctaTxt}>ابدأ الطلب</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ns = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 22,
    marginTop: 14,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Palette.cardB,
    // flexDirection: "row",
    // alignItems: "center",
    padding: 18,
    gap: 14,
    // justifyContent: "space-between",
    shadowColor: "#1f3326",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(31,51,38,0.10)",
  },
  logoImg: { width: "100%", height: "100%", borderRadius: "50%" },
  body: { gap: 6, alignItems: "flex-end" },
  title: {
    fontSize: 17,
    color: Palette.greenDk,
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 11,
    color: "rgba(29,63,42,0.72)",
    fontFamily: Fonts.arabicMedium,
    lineHeight: 16,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: Palette.greenDk,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 4,
    width: "auto",
  },
  ctaTxt: {
    color: "#fff",
    fontSize: 12,
    fontFamily: Fonts.arabicBold,
    textAlign: "center",
  },
});

function QuickActions({ onReviews }: { onReviews: () => void }) {
  const router = useRouter();
  const items: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      label: "العملاء",
      icon: "people-outline",
      onPress: () => router.push("/customers" as any),
    },
    {
      label: "المنتجات",
      icon: "cube-outline",
      onPress: () => router.push("/products"),
    },
    { label: "مراجعات", icon: "star-outline", onPress: onReviews },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      label: "المخزون",
      icon: "file-tray-stacked-outline",
      onPress: () => router.push("/stock" as any),
    },
    {
      label: "التقارير",
      icon: "bar-chart-outline",
      onPress: () => router.push("/reports" as any),
    },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={qa.grid}
    >
      {items.map((it) => (
        <Pressable key={it.label} style={qa.cell} onPress={it.onPress}>
          <View style={qa.icon}>
            <Ionicons name={it.icon} size={20} color={Palette.greenDk} />
          </View>
          <Text style={qa.label}>{it.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const qa = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 18,
  },
  cell: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 8,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.cardA,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, color: Palette.ink, fontFamily: Fonts.arabicBold },
});

function RecentOrders({ date }: { date: Date }) {
  const router = useRouter();
  const isoDate = useMemo(() => toISODate(date), [date]);
  const orders = useSalesOrders({ date: isoDate, limit: 5 });

  const dayLabel = useMemo(() => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - TODAY.getTime()) / 86400000);
    if (diff === 0) return "اليوم";
    if (diff === -1) return "أمس";
    if (diff === 1) return "غدًا";
    return `${arDigits(d.getDate())} ${arMonths[d.getMonth()]}`;
  }, [date]);

  return (
    <View style={ro.wrap}>
      <View style={ro.titleRow}>
        <Text style={ro.title}>الطلبات الأخيرة</Text>
        <Pressable
          style={ro.seeAll}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.navigate("/orders" as any)}
        >
          <Ionicons name="chevron-back" size={14} color={Palette.green} />
          <Text style={ro.seeAllTxt}>عرض الكل</Text>
        </Pressable>
      </View>

      <View style={ro.card}>
        {orders.isLoading ? (
          <View style={ro.center}>
            <ActivityIndicator color={Palette.green} />
          </View>
        ) : orders.isError ? (
          <Text style={ro.errorTxt}>
            تعذر تحميل الطلبات: {(orders.error as Error).message}
          </Text>
        ) : (orders.data ?? []).length === 0 ? (
          <Text style={ro.emptyTxt}>لا توجد طلبات لهذا التاريخ</Text>
        ) : (
          orders.data!.map((o, i) => (
            <View key={o.id} style={i > 0 && ro.rowDivider}>
              <OrderRow
                order={o}
                onPress={() =>
                  router.push({
                    pathname: "/orders/[id]",
                    params: { id: o.id },
                  })
                }
              />
            </View>
          ))
        )}
      </View>

      <Text style={ro.dateNote}>
        عرض الطلبات لتاريخ{" "}
        <Text style={{ color: Palette.ink, fontFamily: Fonts.arabicBold }}>
          {dayLabel}
        </Text>
      </Text>
    </View>
  );
}

const ro = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 120 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    color: Palette.ink,
    fontFamily: Fonts.arabicBold,
    letterSpacing: -0.3,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllTxt: {
    fontSize: 12,
    color: Palette.green,
    fontFamily: Fonts.arabicBold,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 20,
    overflow: "hidden",
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  center: { padding: 28, alignItems: "center" },
  emptyTxt: {
    padding: 28,
    textAlign: "center",
    color: Palette.inkSoft,
    fontSize: 13,
    fontFamily: Fonts.arabic,
  },
  errorTxt: {
    padding: 20,
    textAlign: "center",
    color: "#8a3e3e",
    fontSize: 12,
    fontFamily: Fonts.arabicMedium,
  },
  dateNote: {
    marginTop: 10,
    fontSize: 11,
    color: Palette.inkSoft,
    textAlign: "center",
    fontFamily: Fonts.arabic,
  },
});

export default function HomeScreen() {
  const [selected, setSelected] = useState<Date>(TODAY);
  const [showReviews, setShowReviews] = useState(false);
  return (
    <Screen>
      <OfflineBanner />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header />
        <HorizontalCalendar selected={selected} onSelect={setSelected} />
        <NewOrderCard />
        <QuickActions onReviews={() => setShowReviews(true)} />
        <RecentOrders date={selected} />
      </ScrollView>
      <ReviewsModal
        visible={showReviews}
        onClose={() => setShowReviews(false)}
      />
    </Screen>
  );
}
