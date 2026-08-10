import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { AccessDenied } from '@/components/AccessDenied';
import { Tap } from '@/components/Tap';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, Radius, arDigits } from '@/constants/theme';
import { useCustomers } from '@/features/partners/partners.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import type { Partner } from '@/lib/database.types';
import { CLIENT_ID } from '@/lib/tenant';

function initialFor(name: string): string {
  const stripped = name.replace(/^(شركة|أزهار|أوك|مطاحن|مؤسسة|متاجر|مزارع|بقالات)/, '').trim();
  return (stripped || name).charAt(0);
}

function Row({ c, onPress }: { c: Partner; onPress: () => void }) {
  return (
    <Tap style={styles.row} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTxt}>{initialFor(c.partner_name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{c.partner_name}</Text>
        {c.phone_no ? (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={10} color={Palette.inkSoft} />
            <Text style={styles.phone}>{c.phone_no}</Text>
          </View>
        ) : null}
      </View>
    </Tap>
  );
}

export default function CustomersScreen() {
  const { can } = usePermissions();
  const router = useRouter();
  const [q, setQ] = useState('');

  if (!can('read_customers')) return <AccessDenied />;
  const customers = useCustomers(CLIENT_ID);
  const list = customers.data ?? [];

  const filtered = useMemo(() => {
    const term = q.trim();
    if (!term) return list;
    return list.filter(
      (c) => c.partner_name.includes(term) || (c.phone_no ?? '').includes(term),
    );
  }, [list, q]);

  return (
    <Screen>
      <OfflineBanner />
      <ScreenHeader eyebrow="الدليل" title="الزبائن" trailing="filter" />

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={Palette.inkSoft} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="ابحث بالاسم أو رقم الجوال..."
            placeholderTextColor={Palette.inkSoft}
            style={styles.input}
          />
          <Text style={styles.count}>{arDigits(filtered.length)} زبون</Text>
        </View>
      </View>

      {customers.isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
      ) : customers.isError ? (
        <Text style={styles.error}>
          تعذر تحميل الزبائن: {(customers.error as Error).message}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.listWrap}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            <Text style={styles.empty}>{q.trim() ? 'لا توجد نتائج' : 'لا يوجد زبائن'}</Text>
          }
          renderItem={({ item }) => (
            <Row
              c={item}
              onPress={() => router.push({ pathname: '/customers/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}

      <Tap
        style={styles.fab}
        onPress={() => router.push('/customers/new')}>
        <Ionicons name="add" size={26} color="#fff" />
      </Tap>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Palette.line,
  },
  input: { flex: 1, fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0 },
  count: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
  listWrap: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 120 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Palette.surface, padding: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.line,
  },
  divider: { height: 8 },
  avatar: {
    width: 44, height: 44, borderRadius: Radius.pill, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: Palette.greenDk, fontFamily: Fonts.arabicBold, fontSize: 18 },
  name: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  phone: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic },
  balance: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  balanceLabel: { fontSize: 10, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 1 },
  center: { padding: 40, alignItems: 'center' },
  empty: { padding: 40, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },
  error: { padding: 24, textAlign: 'center', color: Palette.danger, fontSize: 12, fontFamily: Fonts.arabicMedium },
  fab: {
    position: 'absolute', bottom: 28, left: 22,
    width: 56, height: 56, borderRadius: Radius.pill, backgroundColor: Palette.greenDk,
    alignItems: 'center', justifyContent: 'center',
  },
});
