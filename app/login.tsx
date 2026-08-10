import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Tap } from '@/components/Tap';
import { Fonts, Palette, Radius } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';

export default function LoginScreen() {
  const router = useRouter();
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      await signInWithPassword(email.trim(), pass);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تسجيل الدخول');
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Image
              source={require('@/assets/images/logo.jpg')}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.eyebrow}>مرحبًا بعودتك</Text>
          <Text style={styles.title}>سجّل الدخول إلى حسابك</Text>
          <Text style={styles.subtitle}>أدخل بياناتك للمتابعة إلى لوحة المبيعات</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Ionicons name="mail-outline" size={18} color={Palette.inkSoft} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="البريد الإلكتروني"
              placeholderTextColor={Palette.inkSoft}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
            />
          </View>
          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={18} color={Palette.inkSoft} />
            <TextInput
              value={pass}
              onChangeText={setPass}
              placeholder="كلمة المرور"
              placeholderTextColor={Palette.inkSoft}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Tap style={styles.forgot}>
            <Text style={styles.forgotTxt}>نسيت كلمة المرور؟</Text>
          </Tap>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Tap
            disabled={loading || !email || !pass}
            style={[
              styles.cta,
              (loading || !email || !pass) && styles.ctaDisabled,
            ]}
            onPress={onSubmit}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaTxt}>تسجيل الدخول</Text>
                <Ionicons name="arrow-back" size={16} color="#fff" />
              </>
            )}
          </Tap>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTxt}>ليس لديك حساب؟ </Text>
          <Tap><Text style={styles.footerLink}>تواصل مع المسؤول</Text></Tap>
        </View>

        <View style={styles.credit}>
          <Text style={styles.creditTxt}>Developed by Waleed Mohammed Saeed</Text>
          <Text style={styles.creditTxt}>© 2026 — All Rights Reserved.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 28 },
  brand: { alignItems: 'center', gap: 8 },
  logo: {
    width: 96, height: 96, borderRadius: Radius.xl, backgroundColor: '#fff',
    overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: Palette.line,
  },
  logoImg: { width: '100%', height: '100%' },
  eyebrow: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  title: { fontSize: 22, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.4, textAlign: 'center' },
  subtitle: {
    fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabic,
    textAlign: 'center', lineHeight: 20, marginTop: 4, maxWidth: 280,
  },
  form: { gap: 12 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Palette.line,
  },
  input: { flex: 1, fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0 },
  forgot: { alignSelf: 'flex-start' },
  forgotTxt: { fontSize: 12, color: Palette.green, fontFamily: Fonts.arabicBold },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Palette.greenDk, paddingVertical: 16, borderRadius: Radius.md, marginTop: 8,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaTxt: { color: '#fff', fontSize: 15, fontFamily: Fonts.arabicBold },
  error: { fontSize: 12, color: Palette.danger, fontFamily: Fonts.arabicMedium, textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerTxt: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabic },
  footerLink: { fontSize: 12, color: Palette.green, fontFamily: Fonts.arabicBold },
  credit: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Palette.cardA,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  creditTxt: { fontSize: 11, color: Palette.greenDk, fontFamily: Fonts.arabicMedium },
});
