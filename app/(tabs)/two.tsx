import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Fonts, Palette } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';

export default function MoreScreen() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);

  const onSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      router.replace('/login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.center}>
        <View style={styles.icon}>
          <Ionicons name="person-outline" size={40} color={Palette.greenDk} />
        </View>
        {user?.email ? <Text style={styles.title}>{user.email}</Text> : null}
        <Text style={styles.body}>
          هذا التبويب فارغ عمدًا. أخبرني بما تريد إضافته هنا — لوحة معلومات، عملاء، مخزون، إعدادات — وسأبنيه لك.
        </Text>

        <Pressable
          disabled={busy}
          onPress={onSignOut}
          style={({ pressed }) => [styles.signOut, (pressed || busy) && { opacity: 0.85 }]}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.signOutTxt}>تسجيل الخروج</Text>
            </>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 120, gap: 16,
  },
  icon: {
    width: 92, height: 92, borderRadius: 28, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
  body: { fontSize: 13, color: Palette.inkSoft, textAlign: 'center', lineHeight: 22, fontFamily: Fonts.arabic, maxWidth: 280 },
  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Palette.greenDk, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginTop: 16,
  },
  signOutTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
});
