import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useItems } from '@/features/items/items.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import type { InventoryItem } from '@/lib/database.types';
import { swatchFor } from '@/lib/swatch';
import { itemPackagings } from '@/lib/utils';
import { Fonts, Palette, Radius, arDigits } from '@/constants/theme';

function ProductImage({ item }: { item: InventoryItem }) {
  const [light, dark] = swatchFor(item.id ?? item.item_name);
  return (
    <View style={[styles.img, { backgroundColor: dark }]}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: light, opacity: 0.6 }]} />
      <Ionicons name="cube-outline" size={26} color="#fff" />
    </View>
  );
}

function PkgBadge({ label }: { label: string }) {
  return (
    <View style={styles.pkg}>
      <Text style={styles.pkgTxt}>{label}</Text>
    </View>
  );
}

export default function ProductsScreen() {
  const { isCustomer } = usePermissions();
  const [q, setQ] = useState('');
  const items = useItems(q || undefined);

  const list = items.data ?? [];

  return (
    <Screen>
      <OfflineBanner />
      <ScreenHeader eyebrow="الكتالوج" title="المنتجات" trailing="filter" />

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={Palette.inkSoft} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="ابحث عن منتج..."
            placeholderTextColor={Palette.inkSoft}
            style={styles.input}
          />
          <Text style={styles.count}>{arDigits(list.length)} منتج</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listWrap} showsVerticalScrollIndicator={false}>
        {items.isLoading ? (
          <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
        ) : items.isError ? (
          <Text style={styles.error}>تعذر تحميل المنتجات: {(items.error as Error).message}</Text>
        ) : (
          <View style={styles.list}>
            {list.map((p, i) => {
              const packs = itemPackagings(p);
              return (
                <View key={p.id} style={[styles.row, i > 0 && styles.rowDivider]}>
                  <ProductImage item={p} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.item_name}</Text>
                    {packs.length > 0 && (
                      <View style={styles.pkgs}>
                        {packs.map((k) => <PkgBadge key={k.id} label={k.pack_arab} />)}
                      </View>
                    )}
                  </View>
                  {!isCustomer && (
                    <View style={styles.stockBox}>
                      <Text style={styles.stockNum}>{arDigits(p.quantity)}</Text>
                      <Text style={styles.stockLabel}>متوفر</Text>
                    </View>
                  )}
                </View>
              );
            })}
            {list.length === 0 && !items.isLoading && (
              <Text style={styles.empty}>لا توجد نتائج</Text>
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  img: {
    width: 60, height: 60, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  name: { fontSize: 15, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  cost: { fontSize: 12, color: Palette.green, fontFamily: Fonts.arabicBold, marginTop: 2, marginBottom: 6 },
  pkgs: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  pkg: { backgroundColor: Palette.greenDk, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  pkgTxt: { color: '#fff', fontSize: 10, fontFamily: Fonts.arabicBold },
  stockBox: { alignItems: 'center', minWidth: 44 },
  stockNum: { fontSize: 16, color: Palette.ink, fontFamily: Fonts.arabicBold },
  stockLabel: { fontSize: 10, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  empty: { padding: 32, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },
  center: { padding: 40, alignItems: 'center' },
  error: { padding: 24, textAlign: 'center', color: Palette.danger, fontSize: 13, fontFamily: Fonts.arabicMedium },
});
