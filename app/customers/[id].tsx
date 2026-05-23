import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette } from '@/constants/theme';
import { useCustomer } from '@/features/partners/partners.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
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

// ─── admin: link/unlink section ───────────────────────────────────────────────

function LinkSection({ partnerId }: { partnerId: string }) {
  const [linkedEmail, setLinkedEmail] = useState<string | null | undefined>(undefined);
  const [emailInput, setEmailInput] = useState('');
  const [busy, setBusy] = useState(false);

  // Load current linked email
  useEffect(() => {
    supabase
      .rpc('get_partner_linked_email', { p_partner_id: partnerId })
      .then(({ data, error }) => {
        if (!error) setLinkedEmail(data ?? null);
      });
  }, [partnerId]);

  const handleLink = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return Alert.alert('', 'أدخل البريد الإلكتروني');
    setBusy(true);
    const { data, error } = await supabase.rpc('link_customer_to_user', {
      p_partner_id: partnerId,
      p_email: email,
    });
    setBusy(false);
    if (error) {
      Alert.alert('خطأ', error.message);
      return;
    }
    if (data?.error === 'user_not_found') {
      Alert.alert('غير موجود', 'لا يوجد حساب مسجل بهذا البريد الإلكتروني');
      return;
    }
    setLinkedEmail(email);
    setEmailInput('');
    Alert.alert('تم الربط', `تم ربط الزبون بحساب ${email}`);
  };

  const handleUnlink = () => {
    Alert.alert('إلغاء الربط', `هل تريد فصل هذا الزبون عن حساب ${linkedEmail}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'فصل',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.rpc('unlink_customer_from_user', {
            p_partner_id: partnerId,
          });
          setBusy(false);
          if (error) {
            Alert.alert('خطأ', error.message);
          } else {
            setLinkedEmail(null);
          }
        },
      },
    ]);
  };

  if (linkedEmail === undefined) {
    return (
      <View style={ls.card}>
        <ActivityIndicator color={Palette.green} size="small" />
      </View>
    );
  }

  return (
    <View style={ls.card}>
      <View style={ls.headRow}>
        <View style={ls.iconWrap}>
          <Ionicons name="link-outline" size={16} color={Palette.greenDk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ls.title}>ربط بحساب مستخدم</Text>
          <Text style={ls.sub}>يتيح للزبون رؤية طلباته فقط عبر التطبيق</Text>
        </View>
      </View>

      {linkedEmail ? (
        // ── linked state ──
        <View style={ls.linkedRow}>
          <View style={ls.linkedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Palette.green} />
            <Text style={ls.linkedEmail}>{linkedEmail}</Text>
          </View>
          <Pressable
            disabled={busy}
            onPress={handleUnlink}
            style={[ls.unlinkBtn, busy && { opacity: 0.5 }]}>
            <Ionicons name="close-outline" size={14} color="#8a3e3e" />
            <Text style={ls.unlinkTxt}>فصل</Text>
          </Pressable>
        </View>
      ) : (
        // ── unlinked state ──
        <View style={ls.inputRow}>
          <TextInput
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder="البريد الإلكتروني للمستخدم"
            placeholderTextColor={Palette.inkSoft}
            autoCapitalize="none"
            keyboardType="email-address"
            style={ls.input}
          />
          <Pressable
            disabled={busy || !emailInput.trim()}
            onPress={handleLink}
            style={[ls.linkBtn, (busy || !emailInput.trim()) && ls.linkBtnDisabled]}>
            {busy
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={ls.linkBtnTxt}>ربط</Text>
            }
          </Pressable>
        </View>
      )}
    </View>
  );
}

const ls = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface, borderRadius: 20, padding: 14, gap: 12,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  sub: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2, lineHeight: 16 },
  linkedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  linkedBadge: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(45,90,63,0.08)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  linkedEmail: { fontSize: 12, color: Palette.green, fontFamily: Fonts.arabicMedium, flex: 1 },
  unlinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(138,62,62,0.08)',
  },
  unlinkTxt: { fontSize: 12, color: '#8a3e3e', fontFamily: Fonts.arabicBold },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 12, color: Palette.ink, fontFamily: Fonts.arabic,
    textAlign: 'left',
  },
  linkBtn: {
    backgroundColor: Palette.greenDk, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center', minWidth: 60,
  },
  linkBtnDisabled: { opacity: 0.45 },
  linkBtnTxt: { fontSize: 13, color: '#fff', fontFamily: Fonts.arabicBold },
});

// ─── main screen ─────────────────────────────────────────────────────────────

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = usePermissions();
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
                onPress={() => Linking.openURL('tel:00966502802984')}>
                <Ionicons name="call-outline" size={16} color="#fff" />
                <Text style={styles.actionTxt}>اتصال</Text>
              </Pressable>
            ) : null}
            {c.phone_no ? (
              <Pressable
                style={({ pressed }) => [styles.actionAlt, pressed && { opacity: 0.85 }]}
                onPress={() => Linking.openURL('https://wa.me/966502802984')}>
                <Ionicons name="logo-whatsapp" size={16} color={Palette.greenDk} />
                <Text style={styles.actionAltTxt}>واتساب</Text>
              </Pressable>
            ) : null}
          </View>

          {isAdmin && <LinkSection partnerId={c.id} />}
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
