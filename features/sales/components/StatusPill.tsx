import { StyleSheet, Text, View } from 'react-native';

import type { OrderStatus } from '@/lib/database.types';
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/utils';
import { Fonts, Radius } from '@/constants/theme';

export function StatusPill({ status, size = 'sm' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const color = ORDER_STATUS_COLOR[status];
  const fs = size === 'md' ? 12 : 10;
  const py = size === 'md' ? 4 : 2;
  return (
    <View style={[styles.pill, { backgroundColor: `${color}1a`, paddingVertical: py }]}>
      <Text style={[styles.txt, { color, fontSize: fs }]}>{ORDER_STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 8, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  txt: { fontFamily: Fonts.arabicBold },
});
