import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette } from '@/constants/theme';
import { useCustomer } from '@/features/partners/partners.hooks';
import { CLIENT_ID } from '@/lib/tenant';

function initialFor(name: string): string {
  const stripped = name.replace(/^(شركة|أزهار|أوك|مطاحن|مؤسسة|متاجر|مزارع|بقالات)/, '').trim();
  return (stripped || name).charAt(0);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useCustomer(id ?? null, CLIENT_ID);
  const c = query.data;

  return (
    <Screen>
      <OfflineBanner />
      <ScreenHeader eyebrow="الزبائن" title="بطاقة الزبون" trailing="share" />

      {query.isLoading ? (
        <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
      ) : query.isError ? (
        <Text style={styles.error}>تعذر التحميل: {(query.error as Error).message}</Text>
      ) : !c ? (
        <Text style={styles.empty}>لم يتم العثور على الزبون</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>{initialFor(c.partner_name)}</Text>
            </View>
            <Text style={styles.name}>{c.partner_name}</Text>
            {c.phone_no ? (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color={Palette.inkSoft} />
                <Text style={styles.phone}>{c.phone_no}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.statsCard}>
            <Stat label="النوع" value="زبون" />
          </View>

          <View style={styles.actions}>
            {c.phone_no ? (
              <Pressable
                style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}
                onPress={() => Linking.openURL(`tel:${c.phone_no}`)}>
                <Ionicons name="call-outline" size={16} color="#fff" />
                <Text style={styles.actionTxt}>اتصال</Text>
              </Pressable>
            ) : null}
            {c.phone_no ? (
              <Pressable
                style={({ pressed }) => [styles.actionAlt, pressed && { opacity: 0.85 }]}
                onPress={() => Linking.openURL(`https://wa.me/${c.phone_no?.replace(/\D/g, '')}`)}>
                <Ionicons name="logo-whatsapp" size={16} color={Palette.greenDk} />
                <Text style={styles.actionAltTxt}>واتساب</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 120, gap: 16 },
  hero: { alignItems: 'center', gap: 10, paddingTop: 8 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1f3326', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  avatarTxt: { color: Palette.greenDk, fontFamily: Fonts.arabicBold, fontSize: 36 },
  name: { fontSize: 22, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3, textAlign: 'center' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phone: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabic },
  statsCard: {
    flexDirection: 'row', backgroundColor: Palette.surface, borderRadius: 20,
    paddingVertical: 18, paddingHorizontal: 12,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
  statLabel: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic },
  statDivider: { width: 1, backgroundColor: Palette.lineStrong, marginVertical: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  action: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Palette.greenDk, paddingVertical: 14, borderRadius: 14,
  },
  actionTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
  actionAlt: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', paddingVertical: 14, borderRadius: 14,
  },
  actionAltTxt: { color: Palette.greenDk, fontSize: 14, fontFamily: Fonts.arabicBold },
  center: { padding: 40, alignItems: 'center' },
  empty: { padding: 40, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },
  error: { padding: 24, textAlign: 'center', color: '#8a3e3e', fontSize: 12, fontFamily: Fonts.arabicMedium },
});
