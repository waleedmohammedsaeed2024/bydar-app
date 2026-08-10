import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSalesOrdersWithLines } from '@/features/sales/sales.hooks';
import { Fonts, Palette, Radius, arDigits } from '@/constants/theme';
type Agg = {
  key: string;
  itemName: string;
  packagingName: string;
  qty: number;
};

export default function ProductsByQtyReport() {
  const orders = useSalesOrdersWithLines();

  const aggregated = useMemo<Agg[]>(() => {
    const map = new Map<string, Agg>();
    for (const o of orders.data ?? []) {
      for (const l of o.sales_order_item ?? []) {
        if (l.deleted_at) continue;
        const itemName = l.item?.item_name ?? '—';
        const packagingName = l.packaging?.pack_arab ?? 'بلا تعبئة';
        const key = `${l.item_id}::${l.packaging_id ?? 'none'}`;
        const existing = map.get(key);
        if (existing) {
          existing.qty += l.quantity;
        } else {
          map.set(key, { key, itemName, packagingName, qty: l.quantity });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [orders.data]);

  const totalQty = aggregated.reduce((s, a) => s + a.qty, 0);

  return (
    <Screen>
      <ScreenHeader eyebrow="تقرير" title="المنتجات حسب الكمية" trailing="none" />
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{arDigits(totalQty)}</Text>
            <Text style={styles.statLabel}>إجمالي الكمية</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={styles.statValue}>{arDigits(aggregated.length)}</Text>
            <Text style={styles.statLabel}>أصناف فريدة</Text>
          </View>
        </View>

        {orders.isLoading ? (
          <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
        ) : orders.isError ? (
          <Text style={styles.error}>تعذر تحميل البيانات: {(orders.error as Error).message}</Text>
        ) : aggregated.length === 0 ? (
          <Text style={styles.empty}>لا توجد بيانات</Text>
        ) : (
          <View style={styles.list}>
            {aggregated.map((a, i) => {
              const pct = totalQty > 0 ? a.qty / totalQty : 0;
              return (
                <View key={a.key} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="cube-outline" size={18} color={Palette.greenDk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{a.itemName}</Text>
                    <Text style={styles.pkg}>{a.packagingName}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(4, pct * 100)}%` }]} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={styles.qty}>{arDigits(a.qty)}</Text>
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
  iconWrap: {
    width: 38, height: 38, borderRadius: Radius.sm, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  pkg: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2 },
  barTrack: {
    height: 4, borderRadius: 2, backgroundColor: 'rgba(31,51,38,0.08)', marginTop: 8, overflow: 'hidden',
  },
  barFill: { height: 4, backgroundColor: Palette.green },
  qty: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  value: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  empty: { padding: 40, textAlign: 'center', color: Palette.inkSoft, fontFamily: Fonts.arabic },
  error: { padding: 24, textAlign: 'center', color: Palette.danger, fontSize: 12, fontFamily: Fonts.arabicMedium },
  center: { padding: 40, alignItems: 'center' },
});
