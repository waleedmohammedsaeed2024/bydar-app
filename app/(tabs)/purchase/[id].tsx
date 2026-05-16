import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, arDigits, arMonths } from '@/constants/theme';
import { usePurchaseInvoice } from '@/features/purchases/purchases.hooks';
import type { PurchaseInvoiceItem } from '@/lib/database.types';
import { formatCurrency } from '@/lib/utils';

function arDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${arDigits(d.getDate())} ${arMonths[d.getMonth()]} ${arDigits(d.getFullYear())} • ${arDigits(hh)}:${arDigits(mm)}`;
}

function lineTotal(l: PurchaseInvoiceItem): number {
  return Number(l.item_cost) * Number(l.quantity);
}

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const purchase = usePurchaseInvoice(id ? String(id) : undefined);

  const { lines, total } = useMemo(() => {
    const all = purchase.data?.purchase_invoice_item ?? [];
    const live = all.filter((l) => !l.deleted_at);
    const t = live.reduce((s, l) => s + lineTotal(l), 0);
    return { lines: live, total: t };
  }, [purchase.data]);

  if (purchase.isLoading) {
    return (
      <Screen>
        <ScreenHeader eyebrow="فاتورة شراء" title="جارٍ التحميل..." />
        <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
      </Screen>
    );
  }
  if (purchase.isError || !purchase.data) {
    return (
      <Screen>
        <ScreenHeader eyebrow="فاتورة شراء" title="خطأ" />
        <Text style={styles.error}>
          {(purchase.error as Error | undefined)?.message ?? 'تعذر تحميل الفاتورة'}
        </Text>
      </Screen>
    );
  }

  const p = purchase.data;
  const phone = p.supplier?.phone_no;

  return (
    <Screen>
      <ScreenHeader eyebrow="فاتورة شراء" title={p.invoice_no} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="receipt-outline" size={22} color={Palette.greenDk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supplierName} numberOfLines={1}>
                {p.supplier?.partner_name ?? '—'}
              </Text>
              <Text style={styles.subDate}>{arDateTime(p.invoice_date)}</Text>
            </View>
            {phone && (
              <Pressable
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${phone}`)}
                hitSlop={8}>
                <Ionicons name="call-outline" size={16} color="#fff" />
              </Pressable>
            )}
          </View>

          <View style={styles.metaGrid}>
            <MetaCell label="رقم الفاتورة" value={p.invoice_no} />
            <MetaCell label="رقم فاتورة المورد" value={p.supplier_inv_no ?? '—'} />
            <MetaCell label="عدد الأصناف" value={arDigits(lines.length)} />
            <MetaCell label="الإجمالي" value={formatCurrency(total)} accent />
          </View>
        </View>

        <Text style={styles.sectionTitle}>الأصناف</Text>

        {lines.length === 0 ? (
          <Text style={styles.empty}>لا توجد أصناف في هذه الفاتورة</Text>
        ) : (
          <View style={styles.linesCard}>
            {lines.map((l, i) => (
              <View key={l.id} style={[styles.lineRow, i > 0 && styles.lineDivider]}>
                <View style={styles.lineIcon}>
                  <Ionicons name="cube-outline" size={18} color={Palette.greenDk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {l.item?.item_name ?? '—'}
                  </Text>
                  <View style={styles.lineMetaRow}>
                    {l.packaging?.pack_arab && (
                      <View style={styles.pkgBadge}>
                        <Text style={styles.pkgBadgeTxt}>{l.packaging.pack_arab}</Text>
                      </View>
                    )}
                    <Text style={styles.lineMeta}>
                      {arDigits(Number(l.quantity))} × {formatCurrency(Number(l.item_cost))}
                    </Text>
                  </View>
                  {l.description && (
                    <Text style={styles.lineDesc} numberOfLines={2}>{l.description}</Text>
                  )}
                </View>
                <Text style={styles.lineTotal}>{formatCurrency(lineTotal(l))}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>الإجمالي الكلي</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function MetaCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, accent && styles.metaValueAccent]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 130, gap: 14 },
  center: { padding: 40, alignItems: 'center' },
  error: { padding: 24, textAlign: 'center', color: '#8a3e3e', fontSize: 13, fontFamily: Fonts.arabicMedium },

  headerCard: {
    backgroundColor: Palette.surface, borderRadius: 22, padding: 14, gap: 14,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  supplierName: { fontSize: 17, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
  subDate: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginTop: 2 },
  callBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.greenDk,
    alignItems: 'center', justifyContent: 'center',
  },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaCell: {
    flexGrow: 1, flexBasis: '46%',
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 4,
  },
  metaLabel: { fontSize: 10, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  metaValue: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
  metaValueAccent: { color: Palette.greenDk },

  sectionTitle: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, paddingHorizontal: 4 },
  empty: { padding: 32, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },

  linesCard: { backgroundColor: Palette.surface, borderRadius: 20, overflow: 'hidden' },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  lineDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  lineIcon: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  lineName: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  lineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  pkgBadge: {
    backgroundColor: Palette.greenDk, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  pkgBadgeTxt: { color: '#fff', fontSize: 10, fontFamily: Fonts.arabicBold },
  lineMeta: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  lineDesc: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 4 },
  lineTotal: { fontSize: 13, color: Palette.greenDk, fontFamily: Fonts.arabicBold, marginTop: 10 },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Palette.cardA, padding: 14,
    borderTopWidth: 1, borderTopColor: Palette.lineStrong,
  },
  totalLabel: { fontSize: 13, color: Palette.greenDk, fontFamily: Fonts.arabicBold },
  totalValue: { fontSize: 16, color: Palette.greenDk, fontFamily: Fonts.arabicBold },
});
