import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSalesOrders } from '@/features/sales/sales.hooks';
import { Fonts, Palette, Radius, arDigits } from '@/constants/theme';
type Bucket = {
  day: string;
  count: number;
};

export default function OrdersByDateReport() {
  const orders = useSalesOrders({ limit: 500 });

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const o of orders.data ?? []) {
      const day = o.order_date.slice(0, 10);
      const b = map.get(day);
      if (b) {
        b.count += 1;
      } else {
        map.set(day, { day, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.day.localeCompare(a.day));
  }, [orders.data]);

  const maxCount = buckets.reduce((m, b) => Math.max(m, b.count), 0);
  const totalOrders = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <Screen>
      <ScreenHeader eyebrow="تقرير" title="الطلبات حسب التاريخ" trailing="none" />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{arDigits(totalOrders)}</Text>
            <Text style={styles.statLabel}>إجمالي الطلبات</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{arDigits(buckets.length)}</Text>
            <Text style={styles.statLabel}>أيام</Text>
          </View>
        </View>

        {orders.isLoading ? (
          <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
        ) : orders.isError ? (
          <Text style={styles.error}>تعذر تحميل البيانات: {(orders.error as Error).message}</Text>
        ) : buckets.length === 0 ? (
          <Text style={styles.empty}>لا توجد بيانات</Text>
        ) : (
          <View style={styles.list}>
            {buckets.map((b, i) => {
              const pct = maxCount > 0 ? b.count / maxCount : 0;
              return (
                <View key={b.day} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.day}>{b.day}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(4, pct * 100)}%` }]} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={styles.count}>{arDigits(b.count)} طلب</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row', backgroundColor: Palette.greenDk, borderRadius: Radius.lg, padding: 6, marginBottom: 14,
  },
  stat: { flex: 1, paddingVertical: 12, alignItems: 'center', gap: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.14)' },
  statValue: { fontSize: 18, color: '#fff', fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.78)', fontFamily: Fonts.arabicMedium },
  list: { backgroundColor: Palette.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Palette.line },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  day: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  barTrack: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(31,51,38,0.08)', marginTop: 8, overflow: 'hidden',
  },
  barFill: { height: 6, backgroundColor: Palette.green },
  count: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
  value: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  empty: { padding: 40, textAlign: 'center', color: Palette.inkSoft, fontFamily: Fonts.arabic },
  error: { padding: 24, textAlign: 'center', color: Palette.danger, fontSize: 12, fontFamily: Fonts.arabicMedium },
  center: { padding: 40, alignItems: 'center' },
});
