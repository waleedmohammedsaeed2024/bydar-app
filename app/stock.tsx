import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AccessDenied } from '@/components/AccessDenied';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, Radius, arDigits } from '@/constants/theme';
import { useItems, useItemStocks } from '@/features/items/items.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import type { InventoryItem, Packaging } from '@/lib/database.types';
import { itemPackagings } from '@/lib/utils';

type StockEntry = { packaging: Packaging | null; quantity: number };

function buildEntries(item: InventoryItem, stockByKey: Map<string, number>): StockEntry[] {
  const packs = itemPackagings(item);
  const entries: StockEntry[] = packs.map((p) => ({
    packaging: p,
    quantity: stockByKey.get(`${item.id}|${p.id}`) ?? 0,
  }));
  const baseQty = stockByKey.get(`${item.id}|`) ?? 0;
  if (baseQty > 0 || entries.length === 0) {
    entries.unshift({ packaging: null, quantity: baseQty });
  }
  return entries;
}

function PackBadge({ label, qty }: { label: string; qty: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <View style={styles.badgeDivider} />
      <Text style={styles.badgeQty}>{arDigits(qty)}</Text>
    </View>
  );
}

export default function StockScreen() {
  const { can } = usePermissions();
  const [q, setQ] = useState('');

  if (!can('view_stock')) return <AccessDenied />;
  const items = useItems(q || undefined);
  const list = items.data ?? [];

  const ids = useMemo(() => list.map((i) => i.id), [list]);
  const stocks = useItemStocks(ids);

  const stockByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of stocks.data ?? []) {
      m.set(`${r.item_id}|${r.packaging_id ?? ''}`, r.quantity);
    }
    return m;
  }, [stocks.data]);

  return (
    <Screen>
      <OfflineBanner />
      <ScreenHeader eyebrow="المستودع" title="المخزون" trailing="filter" />

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={Palette.inkSoft} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="ابحث عن صنف..."
            placeholderTextColor={Palette.inkSoft}
            style={styles.input}
          />
          <Text style={styles.count}>{arDigits(list.length)} صنف</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listWrap} showsVerticalScrollIndicator={false}>
        {items.isLoading ? (
          <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
        ) : items.isError ? (
          <Text style={styles.error}>تعذر تحميل المخزون: {(items.error as Error).message}</Text>
        ) : (
          <View style={styles.list}>
            {list.map((it, i) => {
              const entries = buildEntries(it, stockByKey);
              return (
                <View key={it.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <View style={styles.iconBox}>
                    <Ionicons name="layers-outline" size={20} color={Palette.greenDk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{it.item_name}</Text>
                    <View style={styles.badges}>
                      {entries.map((e, idx) => (
                        <PackBadge
                          key={(e.packaging?.id ?? 'base') + idx}
                          label={e.packaging?.pack_arab ?? 'وحدة'}
                          qty={e.quantity}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
            {list.length === 0 && !items.isLoading && (
              <Text style={styles.empty}>لا توجد أصناف لعرضها</Text>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 6 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Palette.surface, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Palette.line,
  },
  input: { flex: 1, fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0 },
  count: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
  listWrap: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 130 },
  list: { backgroundColor: Palette.surface, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Palette.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  iconBox: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2, marginBottom: 6, textAlign: 'right' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#e9ecef',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill,
  },
  badgeLabel: { color: '#495057', fontSize: 11, fontFamily: Fonts.arabicBold },
  badgeDivider: { width: 1, height: 10, backgroundColor: '#adb5bd' },
  badgeQty: { color: '#343a40', fontSize: 11, fontFamily: Fonts.arabicBold },
  empty: { padding: 32, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },
  center: { padding: 40, alignItems: 'center' },
  error: { padding: 24, textAlign: 'center', color: Palette.danger, fontSize: 13, fontFamily: Fonts.arabicMedium },
});
