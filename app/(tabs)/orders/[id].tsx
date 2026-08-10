import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Tap } from '@/components/Tap';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, Radius } from '@/constants/theme';
import { useItemStocks } from '@/features/items/items.hooks';
import { StatusPill } from '@/features/sales/components/StatusPill';
import {
  useCancelOrder,
  useConfirmOrderDelivery,
  useConfirmOrderShipped,
  useDeleteLine,
  useSalesOrder,
  useUpdateLineQty,
} from '@/features/sales/sales.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import { printOrCloseOrderPDF, printOrShareDeliveryNotePDF } from '@/lib/pdf';
import { formatDate, snapQty, type QtyStep } from '@/lib/utils';
import { QtyStepper, QtyText } from '@/components/QtyStepper';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id);
  const { isAdmin, isCustomer, isSalesman, isPurchase } = usePermissions();

  const order = useSalesOrder(orderId);

  const cancel = useCancelOrder();
  const ship = useConfirmOrderShipped();
  const deliver = useConfirmOrderDelivery();
  const removeLine = useDeleteLine(orderId);
  const updateQty = useUpdateLineQty(orderId);
  // Per-line stepping mode; lines default to whole units until switched.
  const [qtySteps, setQtySteps] = useState<Record<string, QtyStep>>({});

  const itemIds = useMemo(
    () => Array.from(new Set((order.data?.sales_order_item ?? [])
      .filter((l) => !l.deleted_at && l.item?.id)
      .map((l) => l.item!.id))),
    [order.data],
  );
  // Customers must not see stock levels — pass empty ids so the query is skipped.
  const stocks = useItemStocks(isCustomer ? [] : itemIds);
  const stockByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stocks.data ?? []) {
      map.set(`${s.item_id}|${s.packaging_id ?? ''}`, Number(s.quantity));
    }
    return map;
  }, [stocks.data]);

  if (order.isLoading) {
    return (
      <Screen>
        <ScreenHeader eyebrow="طلب" title="جاري التحميل..." />
        <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
      </Screen>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Screen>
        <ScreenHeader eyebrow="طلب" title="خطأ" />
        <Text style={styles.error}>
          {(order.error as Error | undefined)?.message ?? 'تعذر تحميل الطلب'}
        </Text>
      </Screen>
    );
  }

  const o = order.data;
  const lines = (o.sales_order_item ?? []).filter((l) => !l.deleted_at);
  // Only purchase and admin can edit order contents.
  const editable = o.status === 'o' && (isAdmin || isPurchase);
  // Order documents (print / delivery note) unlock only once delivery is
  // confirmed ('c'); open ('o') and in-transit ('p') orders have nothing to print.
  const isDelivered = o.status === 'c';
  const phone = o.customer?.phone_no ?? o.client?.phone_no;

  const onCancel = () => {
    Alert.alert('إلغاء الطلب', 'هل أنت متأكد؟', [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'إلغاء', style: 'destructive',
        onPress: () => cancel.mutate(orderId),
      },
    ]);
  };

  // Treat "stock data has loaded but no row exists for this (item, packaging)"
  // as 0 stock — that's a real shortage, not unknown availability.
  const stocksLoaded = !isCustomer && !stocks.isLoading;
  const availFor = (l: { item?: { id: string } | null; packaging_id: string | null; }) => {
    const key = `${l.item?.id ?? ''}|${l.packaging_id ?? ''}`;
    const v = stockByKey.get(key);
    if (v !== undefined) return v;
    return stocksLoaded ? 0 : undefined;
  };
  const hasShortage = lines.some((l) => {
    const avail = availFor(l);
    return avail !== undefined && avail < l.quantity;
  });

  const onShip = () => {
    if (hasShortage) {
      Alert.alert('مخزون غير كافٍ', 'بعض الأصناف لا يكفي مخزونها بالتعبئة المطلوبة');
      return;
    }
    ship.mutate(orderId, {
      onError: (e) =>
        Alert.alert('تعذر الشحن', e instanceof Error ? e.message : 'خطأ غير معروف'),
    });
  };
  const onDeliver = () => deliver.mutate(orderId);

  const onChangeQty = (lineId: string, next: number) => {
    if (next < 0.5) return;
    updateQty.mutate(
      { lineId, quantity: next },
      {
        onError: (e) =>
          Alert.alert('تعذر تحديث الكمية', e instanceof Error ? e.message : 'خطأ غير معروف'),
      },
    );
  };

  const onShare = async () => {
    try {
      await printOrCloseOrderPDF(o);
    } catch (e) {
      Alert.alert('تعذر إنشاء الملف', e instanceof Error ? e.message : 'خطأ غير معروف');
    }
  };

  const onDeliveryNote = async () => {
    try {
      await printOrShareDeliveryNotePDF(o);
    } catch (e) {
      Alert.alert('تعذر إنشاء إذن التسليم', e instanceof Error ? e.message : 'خطأ غير معروف');
    }
  };

  return (
    <Screen>
      <ScreenHeader eyebrow="طلب مبيعات" title={`#${o.id.slice(0, 6)}`} trailing={isCustomer || !isDelivered ? undefined : 'share'} onBack={undefined} onTrailingPress={isCustomer || !isDelivered ? undefined : onShare} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.client}>{o.customer?.partner_name ?? '—'}</Text>
              {o.client?.partner_name && <Text style={styles.customer}>{o.client.partner_name}</Text>}
            </View>
            <StatusPill status={o.status} size="md" />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatDate(o.order_date)}</Text>
            {o.site && <Text style={styles.meta}>· {o.site}</Text>}
          </View>
          {phone && (
            <Tap
              style={styles.phoneBtn}
              onPress={() => Linking.openURL('tel:00966502802984')}>
              <Ionicons name="call-outline" size={14} color="#fff" />
              <Text style={styles.phoneTxt}>اتصال — {phone}</Text>
            </Tap>
          )}
        </View>

        <Text style={styles.sectionTitle}>الأصناف</Text>
        <View style={styles.card}>
          {lines.length === 0 ? (
            <Text style={styles.empty}>لا توجد أصناف</Text>
          ) : (
            lines.map((l, i) => {
              const avail = availFor(l);
              const short = avail !== undefined && avail < l.quantity;
              return (
              <View
                key={l.id}
                style={[
                  styles.line, i > 0 && styles.lineDivider,
                  short && !isCustomer && styles.lineShort,
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{l.item?.item_name ?? '—'}</Text>
                  <Text style={styles.itemMeta}>
                    <QtyText value={Number(l.quantity)} style={styles.itemQty} />
                    × {l.packaging?.pack_arab ?? ''}
                  </Text>
                  {short && !isCustomer && (
                    <Text style={styles.shortTxt}>
                      المتوفر {avail} فقط
                    </Text>
                  )}
                  {editable && (
                    <View style={styles.qtyRow}>
                      <QtyStepper
                        value={Number(l.quantity)}
                        step={qtySteps[l.id] ?? 1}
                        onChange={(next) => onChangeQty(l.id, next)}
                        onStepChange={(step) => {
                          setQtySteps((prev) => ({ ...prev, [l.id]: step }));
                          const snapped = snapQty(Number(l.quantity), step);
                          if (snapped !== Number(l.quantity)) onChangeQty(l.id, snapped);
                        }}
                      />
                    </View>
                  )}
                </View>
                {editable && (
                  <Tap
                    style={styles.removeBtn}
                    hitSlop={8}
                    onPress={() =>
                      Alert.alert('حذف السطر', 'هل تريد حذف هذا الصنف؟', [
                        { text: 'تراجع', style: 'cancel' },
                        { text: 'حذف', style: 'destructive', onPress: () => removeLine.mutate(l.id) },
                      ])
                    }>
                    <Ionicons name="trash-outline" size={16} color={Palette.danger} />
                  </Tap>
                )}
              </View>
              );
            })
          )}
        </View>

        <View style={styles.actions}>
          {isDelivered && (
            <Tap style={[styles.action, styles.actionMuted]} onPress={onShare} disabled>
              <Ionicons name="share-outline" size={16} color={Palette.inkSoft} />
              <Text style={[styles.actionMutedTxt, { color: Palette.inkSoft }]}>طباعة / مشاركة</Text>
            </Tap>
          )}
          {isDelivered && (isAdmin || isSalesman) && (
            <Tap style={[styles.action, styles.actionMuted]} onPress={onDeliveryNote}>
              <Ionicons name="document-text-outline" size={16} color={Palette.ink} />
              <Text style={styles.actionMutedTxt}>إذن التسليم</Text>
            </Tap>
          )}

          {o.status === 'o' && (isAdmin || isPurchase) && (
            <Tap style={[styles.action, styles.actionDanger]} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionPrimaryTxt}>إلغاء الطلب</Text>
            </Tap>
          )}
          {o.status === 'o' && (isAdmin || isPurchase) && (
            <Tap
              disabled={hasShortage || ship.isPending}
              style={[
                styles.action, styles.actionPrimary,
                (hasShortage || ship.isPending) && { opacity: 0.55 },
              ]}
              onPress={onShip}>
              <Ionicons name="cube-outline" size={16} color="#fff" />
              <Text style={styles.actionPrimaryTxt}>
                {hasShortage ? 'مخزون غير كافٍ' : 'وضع للشحن'}
              </Text>
            </Tap>
          )}
          {o.status === 'p' && (isAdmin || isCustomer) && (
            <Tap style={[styles.action, styles.actionPrimary]} onPress={onDeliver}>
              <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
              <Text style={styles.actionPrimaryTxt}>تأكيد التسليم</Text>
            </Tap>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 120, gap: 14 },
  center: { padding: 40, alignItems: 'center' },
  error: { padding: 24, color: Palette.danger, fontFamily: Fonts.arabicMedium, textAlign: 'center' },
  card: { backgroundColor: Palette.surface, borderRadius: Radius.lg, padding: 16, gap: 8, borderWidth: 1, borderColor: Palette.line },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  client: { fontSize: 18, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
  customer: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 6 },
  meta: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabic },
  phoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: 4, backgroundColor: Palette.greenDk, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill,
  },
  phoneTxt: { color: '#fff', fontSize: 12, fontFamily: Fonts.arabicBold },
  sectionTitle: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, marginTop: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  lineDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  lineShort: {
    backgroundColor: '#FFF7C2', // light yellow — ordered qty exceeds stock
    marginHorizontal: -8, paddingHorizontal: 8, borderRadius: Radius.sm,
  },
  shortTxt: { fontSize: 11, color: Palette.warn, fontFamily: Fonts.arabicBold, marginTop: 2 },
  qtyRow: { marginTop: 8 },
  itemName: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  itemMeta: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2 },
  itemQty: { fontSize: 11, color: Palette.ink, fontFamily: Fonts.arabicBold },
  lineTotal: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  removeBtn: { padding: 4 },
  totalLine: { borderTopWidth: 1, borderTopColor: Palette.lineStrong, justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
  totalAmount: { fontSize: 16, color: Palette.ink, fontFamily: Fonts.arabicBold },
  empty: { padding: 20, textAlign: 'center', color: Palette.inkSoft, fontFamily: Fonts.arabic },
  actions: { gap: 8 },
  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: Radius.md,
  },
  actionMuted: { backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: Palette.line },
  actionDisabled: { opacity: 0.45 },
  actionMutedTxt: { color: Palette.ink, fontSize: 14, fontFamily: Fonts.arabicBold },
  actionPrimary: { backgroundColor: Palette.greenDk },
  actionDanger: { backgroundColor: Palette.danger },
  actionPrimaryTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
});
