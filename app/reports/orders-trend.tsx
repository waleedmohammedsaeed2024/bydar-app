import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSalesOrders } from '@/features/sales/sales.hooks';
import { Fonts, Palette, arDigits, arMonths } from '@/constants/theme';
type MonthBucket = {
  key: string;
  label: string;
  count: number;
};

export default function OrdersTrendReport() {
  const orders = useSalesOrders({ limit: 500 });

  const buckets = useMemo<MonthBucket[]>(() => {
    const map = new Map<string, MonthBucket>();
    for (const o of orders.data ?? []) {
      const d = new Date(o.order_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${arMonths[d.getMonth()]} ${arDigits(d.getFullYear())}`;
      const b = map.get(key);
      if (b) {
        b.count += 1;
      } else {
        map.set(key, { key, label, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [orders.data]);

  const maxCount = buckets.reduce((m, b) => Math.max(m, b.count), 0);
  const trendDir = buckets.length >= 2
    ? (buckets[0].count >= buckets[1].count ? 'up' : 'down')
    : 'flat';
  const trendPct = buckets.length >= 2 && buckets[1].count > 0
    ? Math.round(((buckets[0].count - buckets[1].count) / buckets[1].count) * 100)
    : 0;

  return (
    <Screen>
      <ScreenHeader eyebrow="تقرير" title="الطلبات خلال الشهور" trailing="none" />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{arDigits(buckets.length)}</Text>
            <Text style={styles.statLabel}>أشهر مغطاة</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{arDigits(buckets[0]?.count ?? 0)}</Text>
            <Text style={styles.statLabel}>الشهر الأخير</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={[
              styles.statValue,
              { color: trendDir === 'up' ? '#a8e0a8' : trendDir === 'down' ? '#e0a8a8' : '#fff' },
            ]}>
              {trendDir === 'flat' ? '—' : `${trendDir === 'up' ? '+' : ''}${arDigits(trendPct)}٪`}
            </Text>
            <Text style={styles.statLabel}>الاتجاه</Text>
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
                <View key={b.key} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{b.label}</Text>
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
    flexDirection: 'row', backgroundColor: Palette.greenDk, borderRadius: 18, padding: 6, marginBottom: 14,
  },
  stat: { flex: 1, paddingVertical: 12, alignItems: 'center', gap: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.14)' },
  statValue: { fontSize: 18, color: '#fff', fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.78)', fontFamily: Fonts.arabicMedium },
  list: { backgroundColor: Palette.surface, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.lineStrong },
  label: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  barTrack: {
    height: 6, borderRadius: 3, backgroundColor: 'rgba(31,51,38,0.08)', marginTop: 8, overflow: 'hidden',
  },
  barFill: { height: 6, backgroundColor: Palette.green },
  count: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
  value: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  empty: { padding: 40, textAlign: 'center', color: Palette.inkSoft, fontFamily: Fonts.arabic },
  error: { padding: 24, textAlign: 'center', color: '#8a3e3e', fontSize: 12, fontFamily: Fonts.arabicMedium },
  center: { padding: 40, alignItems: 'center' },
});
