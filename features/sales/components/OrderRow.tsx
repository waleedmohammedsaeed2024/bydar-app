import { StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/features/sales/components/StatusPill';
import type { SalesOrder } from '@/lib/database.types';
import { formatDate } from '@/lib/utils';
import { Fonts, Palette, Radius, arDigits } from '@/constants/theme';
import { Tap } from '@/components/Tap';

const SHORT_ID_LEN = 6;

export function OrderRow({ order, onPress }: { order: SalesOrder; onPress?: () => void }) {
  const customerName = order.customer?.partner_name ?? '—';
  const clientName = order.client?.partner_name ?? null;
  const initial = (customerName.replace(/^(شركة|أزهار|أوك|مطاحن|مؤسسة|متاجر|مزارع|بقالات)/, '').trim() || customerName).charAt(0);
  const totalQty = (order.sales_order_item ?? [])
    .filter((l) => !l.deleted_at)
    .reduce((s, l) => s + (l.quantity ?? 0), 0);
  const shortId = order.id.slice(0, SHORT_ID_LEN);

  return (
    <Tap style={styles.row} onPress={onPress}>
      <View style={styles.thumb}>
        <Text style={styles.thumbTxt}>{initial}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.client} numberOfLines={1}>{customerName}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          #{shortId}{clientName ? ` · ${clientName}` : ''} · {formatDate(order.order_date)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.total}>{arDigits(totalQty)} وحدة</Text>
        <View style={{ marginTop: 4 }}>
          <StatusPill status={order.status} />
        </View>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  thumb: {
    width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  thumbTxt: { color: Palette.greenDk, fontFamily: Fonts.arabicBold, fontSize: 16 },
  client: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  meta: { fontSize: 11, color: Palette.inkSoft, marginTop: 2, fontFamily: Fonts.arabic },
  total: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
});
