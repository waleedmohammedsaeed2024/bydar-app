import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { Fonts, Palette, arDigits, arMonths } from '@/constants/theme';
import { usePurchaseInvoices } from '@/features/purchases/purchases.hooks';
import type { PurchaseInvoice, PurchaseInvoiceItem } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils';
import { useNotificationsStore } from '@/stores/notifications';

function invoiceTotal(items: PurchaseInvoiceItem[] | undefined): number {
  if (!items) return 0;
  return items
    .filter((l) => !l.deleted_at)
    .reduce((s, l) => s + Number(l.item_cost) * Number(l.quantity), 0);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'اليوم';
  if (diff === -1) return 'أمس';
  return `${arDigits(d.getDate())} ${arMonths[d.getMonth()]} ${arDigits(d.getFullYear())}`;
}

export default function PurchaseTab() {
  const router = useRouter();
  const params = useLocalSearchParams<{ created?: string }>();
  const [search, setSearch] = useState('');
  const purchases = usePurchaseInvoices({ search });

  const newPurchaseIds = useNotificationsStore((s) => s.newPurchaseIds);
  const clearPurchases = useNotificationsStore((s) => s.clearPurchases);

  // Auto-clear "new" highlights a few seconds after entering the tab.
  useEffect(() => {
    if (newPurchaseIds.length === 0) return;
    const t = setTimeout(() => clearPurchases(), 6000);
    return () => clearTimeout(t);
  }, [newPurchaseIds.length, clearPurchases]);

  const groups = useMemo(() => {
    const rows = purchases.data ?? [];
    const map = new Map<string, PurchaseInvoice[]>();
    for (const r of rows) {
      const k = dayKey(r.invoice_date);
      const arr = map.get(k) ?? [];
      arr.push(r);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, list]) => ({ key: k, label: dayLabel(list[0].invoice_date), items: list }));
  }, [purchases.data]);

  const justCreatedId = params.created;
  const isNew = (id: string) => id === justCreatedId || newPurchaseIds.includes(id);

  return (
    <Screen>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>المشتريات</Text>
        <Text style={styles.subtitle}>
          {arDigits((purchases.data ?? []).length)} فاتورة
        </Text>
      </View>

      {newPurchaseIds.length > 0 && (
        <View style={styles.notice}>
          <Ionicons name="checkmark-circle" size={16} color={Palette.greenDk} />
          <Text style={styles.noticeTxt}>
            تمت إضافة {arDigits(newPurchaseIds.length)} فاتورة شراء جديدة
          </Text>
          <Pressable hitSlop={8} onPress={clearPurchases}>
            <Ionicons name="close" size={14} color={Palette.greenDk} />
          </Pressable>
        </View>
      )}

      <Pressable style={styles.newBtn} onPress={() => router.push('/purchase/new')}>
        <View style={styles.newIcon}>
          <Ionicons name="add" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.newTitle}>فاتورة شراء جديدة</Text>
          <Text style={styles.newSub}>أضف فاتورة من مورد بأصناف وكميات وأسعار</Text>
        </View>
        <Ionicons name="chevron-back" size={16} color={Palette.inkSoft} />
      </Pressable>

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={Palette.inkSoft} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث برقم الفاتورة أو المورد..."
            placeholderTextColor={Palette.inkSoft}
            style={styles.input}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.listWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={purchases.isRefetching}
            onRefresh={() => purchases.refetch()}
          />
        }>
        {purchases.isLoading ? (
          <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
        ) : purchases.isError ? (
          <Text style={styles.error}>تعذر تحميل المشتريات: {(purchases.error as Error).message}</Text>
        ) : groups.length === 0 ? (
          <Text style={styles.empty}>لا توجد فواتير شراء بعد</Text>
        ) : (
          groups.map((g) => (
            <View key={g.key} style={styles.group}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              <View style={styles.groupCard}>
                {g.items.map((inv, i) => {
                  const total = invoiceTotal(inv.purchase_invoice_item);
                  const linesCount = (inv.purchase_invoice_item ?? []).filter((l) => !l.deleted_at).length;
                  return (
                    <Pressable
                      key={inv.id}
                      style={({ pressed }) => [
                        styles.row,
                        i > 0 && styles.rowDivider,
                        pressed && styles.rowPressed,
                      ]}
                      onPress={() => router.push({ pathname: '/purchase/[id]', params: { id: inv.id } })}>
                      <View style={styles.rowIcon}>
                        <Ionicons name="receipt-outline" size={18} color={Palette.greenDk} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.rowTop}>
                          <Text style={styles.rowName} numberOfLines={1}>
                            {inv.supplier?.partner_name ?? '—'}
                          </Text>
                          {isNew(inv.id) && (
                            <View style={styles.newPill}>
                              <Text style={styles.newPillTxt}>جديد</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {inv.invoice_no}
                          {inv.supplier_inv_no ? `  •  ${inv.supplier_inv_no}` : ''}
                          {`  •  ${arDigits(linesCount)} صنف`}
                        </Text>
                      </View>
                      <Text style={styles.rowTotal}>{formatCurrency(total)}</Text>
                      <Ionicons name="chevron-back" size={14} color={Palette.inkSoft} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22, paddingTop: 12,
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
  },
  title: { fontSize: 24, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },

  notice: {
    marginHorizontal: 22, marginTop: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(46, 113, 75, 0.12)',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
  },
  noticeTxt: { flex: 1, color: Palette.greenDk, fontSize: 12, fontFamily: Fonts.arabicBold },

  newBtn: {
    marginHorizontal: 22, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Palette.cardA, borderRadius: 18, padding: 14,
    shadowColor: '#1f3326', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  newIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.greenDk,
    alignItems: 'center', justifyContent: 'center',
  },
  newTitle: { fontSize: 15, color: Palette.greenDk, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  newSub: { fontSize: 11, color: 'rgba(29,63,42,0.72)', fontFamily: Fonts.arabicMedium, marginTop: 2 },

  searchWrap: { paddingHorizontal: 22, paddingTop: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Palette.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0 },

  listWrap: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 130 },
  group: { marginBottom: 14 },
  groupLabel: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicBold, marginBottom: 6, paddingHorizontal: 4 },
  groupCard: { backgroundColor: Palette.surface, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  rowPressed: { backgroundColor: 'rgba(31,51,38,0.04)' },
  rowIcon: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, flexShrink: 1 },
  rowMeta: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2 },
  rowTotal: { fontSize: 13, color: Palette.greenDk, fontFamily: Fonts.arabicBold },
  newPill: {
    backgroundColor: Palette.greenDk, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
  },
  newPillTxt: { color: '#fff', fontSize: 9, fontFamily: Fonts.arabicBold },

  center: { padding: 40, alignItems: 'center' },
  empty: { padding: 40, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },
  error: { padding: 24, textAlign: 'center', color: '#8a3e3e', fontSize: 13, fontFamily: Fonts.arabicMedium },
});
