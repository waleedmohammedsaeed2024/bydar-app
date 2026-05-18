import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette } from '@/constants/theme';
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
import { printOrCloseOrderPDF } from '@/lib/pdf';
import { formatDate } from '@/lib/utils';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id);
  const order = useSalesOrder(orderId);

  const cancel = useCancelOrder();
  const ship = useConfirmOrderShipped();
  const deliver = useConfirmOrderDelivery();
  const removeLine = useDeleteLine(orderId);
  const updateQty = useUpdateLineQty(orderId);

  const itemIds = useMemo(
    () => Array.from(new Set((order.data?.sales_order_item ?? [])
      .filter((l) => !l.deleted_at && l.item?.id)
      .map((l) => l.item!.id))),
    [order.data],
  );
  const stocks = useItemStocks(itemIds);
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
  const editable = o.status === 'o';
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

  const hasShortage = lines.some((l) => {
    const key = `${l.item?.id ?? ''}|${l.packaging_id ?? ''}`;
    const avail = stockByKey.get(key);
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
    if (next < 1) return;
    updateQty.mutate({ lineId, quantity: next });
  };

  const onShare = async () => {
    try {
      await printOrCloseOrderPDF(o);
    } catch (e) {
      Alert.alert('تعذر إنشاء الملف', e instanceof Error ? e.message : 'خطأ غير معروف');
    }
  };

  return (
    <Screen>
      <ScreenHeader eyebrow="طلب مبيعات" title={`#${o.id.slice(0, 6)}`} trailing="share" onBack={undefined} onTrailingPress={onShare} />

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
            <Pressable
              style={styles.phoneBtn}
              onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Ionicons name="call-outline" size={14} color="#fff" />
              <Text style={styles.phoneTxt}>اتصال — {phone}</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>الأصناف</Text>
        <View style={styles.card}>
          {lines.length === 0 ? (
            <Text style={styles.empty}>لا توجد أصناف</Text>
          ) : (
            lines.map((l, i) => {
              const key = `${l.item?.id ?? ''}|${l.packaging_id ?? ''}`;
              const avail = stockByKey.get(key);
              const short = avail !== undefined && avail < l.quantity;
              return (
              <View
                key={l.id}
                style={[
                  styles.line, i > 0 && styles.lineDivider,
                  short && styles.lineShort,
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{l.item?.item_name ?? '—'}</Text>
                  <Text style={styles.itemMeta}>
                    {l.quantity}× {l.packaging?.pack_arab ?? ''}
                  </Text>
                  {short && (
                    <Text style={styles.shortTxt}>
                      المتوفر {avail} فقط
                    </Text>
                  )}
                  {editable && (
                    <View style={styles.qtyRow}>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => onChangeQty(l.id, l.quantity - 1)}>
                        <Text style={styles.qtyBtnTxt}>−</Text>
                      </Pressable>
                      <Text style={styles.qtyVal}>{l.quantity}</Text>
                      <Pressable
                        style={[styles.qtyBtn, styles.qtyBtnPlus]}
                        onPress={() => onChangeQty(l.id, l.quantity + 1)}>
                        <Text style={styles.qtyBtnPlusTxt}>＋</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
                {editable && (
                  <Pressable
                    style={styles.removeBtn}
                    hitSlop={8}
                    onPress={() =>
                      Alert.alert('حذف السطر', 'هل تريد حذف هذا الصنف؟', [
                        { text: 'تراجع', style: 'cancel' },
                        { text: 'حذف', style: 'destructive', onPress: () => removeLine.mutate(l.id) },
                      ])
                    }>
                    <Ionicons name="trash-outline" size={16} color="#8a3e3e" />
                  </Pressable>
                )}
              </View>
              );
            })
          )}
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.action, styles.actionMuted]} onPress={onShare}>
            <Ionicons name="share-outline" size={16} color={Palette.ink} />
            <Text style={styles.actionMutedTxt}>طباعة / مشاركة</Text>
          </Pressable>

          {o.status === 'o' && (
            <Pressable style={[styles.action, styles.actionDanger]} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionPrimaryTxt}>إلغاء الطلب</Text>
            </Pressable>
          )}
          {o.status === 'o' && (
            <Pressable
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
            </Pressable>
          )}
          {o.status === 'p' && (
            <Pressable style={[styles.action, styles.actionPrimary]} onPress={onDeliver}>
              <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
              <Text style={styles.actionPrimaryTxt}>تأكيد التسليم</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 120, gap: 14 },
  center: { padding: 40, alignItems: 'center' },
  error: { padding: 24, color: '#8a3e3e', fontFamily: Fonts.arabicMedium, textAlign: 'center' },
  card: { backgroundColor: Palette.surface, borderRadius: 20, padding: 16, gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  client: { fontSize: 18, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
  customer: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 6 },
  meta: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabic },
  phoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: 4, backgroundColor: Palette.greenDk, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  phoneTxt: { color: '#fff', fontSize: 12, fontFamily: Fonts.arabicBold },
  sectionTitle: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, marginTop: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  lineDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  lineShort: {
    backgroundColor: '#FFE7C7', // light orange alert
    marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10,
  },
  shortTxt: { fontSize: 11, color: '#8a4f0d', fontFamily: Fonts.arabicBold, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(31,51,38,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnPlus: { backgroundColor: Palette.greenDk },
  qtyBtnTxt: { fontSize: 16, color: Palette.ink, fontFamily: Fonts.arabicBold, lineHeight: 18 },
  qtyBtnPlusTxt: { fontSize: 14, color: '#fff', fontFamily: Fonts.arabicBold, lineHeight: 16 },
  qtyVal: { minWidth: 28, textAlign: 'center', fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
  itemName: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  itemMeta: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2 },
  lineTotal: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  removeBtn: { padding: 4 },
  totalLine: { borderTopWidth: 1, borderTopColor: Palette.lineStrong, justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
  totalAmount: { fontSize: 16, color: Palette.ink, fontFamily: Fonts.arabicBold },
  empty: { padding: 20, textAlign: 'center', color: Palette.inkSoft, fontFamily: Fonts.arabic },
  actions: { gap: 8 },
  action: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
  },
  actionMuted: { backgroundColor: 'rgba(255,255,255,0.85)' },
  actionMutedTxt: { color: Palette.ink, fontSize: 14, fontFamily: Fonts.arabicBold },
  actionPrimary: { backgroundColor: Palette.greenDk },
  actionDanger: { backgroundColor: '#8a3e3e' },
  actionPrimaryTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
});
