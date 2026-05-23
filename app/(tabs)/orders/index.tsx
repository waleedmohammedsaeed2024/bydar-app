import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { Fonts, Palette } from '@/constants/theme';
import { OrderRow } from '@/features/sales/components/OrderRow';
import { useSalesOrders } from '@/features/sales/sales.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import type { OrderStatus } from '@/lib/database.types';
import { STATUS_FILTERS } from '@/lib/utils';

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function OrdersTab() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState<string | undefined>(params.date ?? todayLocal());
  useEffect(() => { if (params.date) setDate(params.date); }, [params.date]);

  const orders = useSalesOrders({ status, search, date });
  const { can } = usePermissions();

  return (
    <Screen>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>طلبات المبيعات</Text>
        {date ? (
          <Pressable style={styles.dateChip} onPress={() => setDate(undefined)}>
            <Ionicons name="calendar-outline" size={12} color="#fff" />
            <Text style={styles.dateChipTxt}>طلبات اليوم</Text>
            <Ionicons name="close" size={12} color="#fff" />
          </Pressable>
        ) : (
          <Pressable style={styles.dateChipOff} onPress={() => setDate(todayLocal())}>
            <Ionicons name="calendar-outline" size={12} color={Palette.greenDk} />
            <Text style={styles.dateChipOffTxt}>اليوم</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={Palette.inkSoft} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث باسم العميل..."
            placeholderTextColor={Palette.inkSoft}
            style={styles.input}
          />
        </View>
      </View>

      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((f) => {
          const sel = status === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setStatus(f.key)}
              style={[styles.chip, sel && styles.chipSel]}>
              <Text style={[styles.chipTxt, sel && styles.chipTxtSel]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listWrap}
        refreshControl={
          <RefreshControl refreshing={orders.isRefetching} onRefresh={() => orders.refetch()} />
        }>
        {orders.isLoading ? (
          <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
        ) : orders.isError ? (
          <Text style={styles.error}>تعذر تحميل الطلبات: {(orders.error as Error).message}</Text>
        ) : (orders.data ?? []).length === 0 ? (
          <Text style={styles.empty}>لا توجد طلبات لعرضها</Text>
        ) : (
          <View style={styles.list}>
            {orders.data!.map((o, i) => (
              <View key={o.id} style={i > 0 && styles.rowDivider}>
                <OrderRow order={o} onPress={() => router.push({ pathname: '/orders/[id]', params: { id: o.id } })} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {can('create_order') && (
        <Pressable style={styles.fab} onPress={() => router.push('/orders/new')}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 24, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.4 },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Palette.greenDk, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  dateChipTxt: { color: '#fff', fontSize: 11, fontFamily: Fonts.arabicBold },
  dateChipOff: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: Palette.line,
  },
  dateChipOffTxt: { color: Palette.greenDk, fontSize: 11, fontFamily: Fonts.arabicBold },
  searchWrap: { paddingHorizontal: 22, paddingTop: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Palette.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0 },
  filtersScroll: { flexGrow: 0, flexShrink: 0 },
  filters: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 10, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    minHeight: 36, justifyContent: 'center',
  },
  chipSel: { backgroundColor: Palette.green },
  chipTxt: { fontSize: 12, color: Palette.ink, fontFamily: Fonts.arabicBold },
  chipTxtSel: { color: '#fff' },
  listWrap: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 130 },
  list: { backgroundColor: Palette.surface, borderRadius: 20, overflow: 'hidden' },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  center: { padding: 40, alignItems: 'center' },
  empty: { padding: 40, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },
  error: { padding: 24, textAlign: 'center', color: '#8a3e3e', fontSize: 13, fontFamily: Fonts.arabicMedium },
  fab: {
    position: 'absolute', bottom: 100, left: 22, // left for RTL = visually leading
    width: 56, height: 56, borderRadius: 28, backgroundColor: Palette.greenDk,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1d3f2a', shadowOpacity: 0.32, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
