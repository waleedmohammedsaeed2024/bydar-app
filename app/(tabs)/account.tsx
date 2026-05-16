import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { Fonts, Palette } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [showPwd, setShowPwd] = useState(false);

  const onSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={36} color={Palette.greenDk} />
        </View>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
        <Text style={styles.role}>
          {(user?.app_metadata?.role as string | undefined) ?? 'مستخدم'}
        </Text>

        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => setShowPwd(true)}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="key-outline" size={18} color={Palette.greenDk} />
              </View>
              <View>
                <Text style={styles.rowLabel}>تغيير كلمة المرور</Text>
                <Text style={styles.rowSub}>قم بتحديث كلمة مرور حسابك</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={16} color={Palette.inkSoft} />
          </Pressable>
        </View>

        <Pressable style={styles.signOut} onPress={onSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.signOutTxt}>تسجيل الخروج</Text>
        </Pressable>
      </View>

      <ChangePasswordSheet visible={showPwd} onClose={() => setShowPwd(false)} />
    </Screen>
  );
}

function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const loading = useAuthStore((s) => s.loading);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNxt, setShowNxt] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent(''); setNext(''); setConfirm('');
    setShowCur(false); setShowNxt(false);
  };

  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!current) return Alert.alert('بيانات ناقصة', 'أدخل كلمة المرور الحالية');
    if (next.length < 6) return Alert.alert('كلمة المرور قصيرة', 'يجب ألا تقل كلمة المرور عن 6 أحرف');
    if (next !== confirm) return Alert.alert('غير مطابقة', 'تأكيد كلمة المرور لا يطابق الكلمة الجديدة');
    if (next === current) return Alert.alert('بدون تغيير', 'الكلمة الجديدة مطابقة للكلمة الحالية');

    setBusy(true);
    try {
      await updatePassword(current, next);
      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح');
      close();
    } catch (e) {
      Alert.alert('فشل التغيير', e instanceof Error ? e.message : 'خطأ غير معروف');
    } finally {
      setBusy(false);
    }
  };

  const pending = busy || loading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={sheet.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={sheet.backdrop} onPress={close} />
        <View style={sheet.body}>
          <View style={sheet.grabberWrap}><View style={sheet.grabber} /></View>
          <View style={sheet.header}>
            <View>
              <Text style={sheet.eyebrow}>الأمان</Text>
              <Text style={sheet.title}>تغيير كلمة المرور</Text>
            </View>
            <Pressable onPress={close} style={sheet.close} hitSlop={8}>
              <Ionicons name="close" size={16} color={Palette.ink} />
            </Pressable>
          </View>

          <View style={sheet.fields}>
            <PasswordField
              label="كلمة المرور الحالية"
              value={current}
              onChange={setCurrent}
              visible={showCur}
              toggle={() => setShowCur((v) => !v)}
              placeholder="••••••••"
            />
            <PasswordField
              label="كلمة المرور الجديدة"
              value={next}
              onChange={setNext}
              visible={showNxt}
              toggle={() => setShowNxt((v) => !v)}
              placeholder="6 أحرف على الأقل"
            />
            <PasswordField
              label="تأكيد كلمة المرور الجديدة"
              value={confirm}
              onChange={setConfirm}
              visible={showNxt}
              toggle={() => setShowNxt((v) => !v)}
              placeholder="أعد كتابة الكلمة الجديدة"
            />
          </View>

          <Pressable
            disabled={pending}
            style={[sheet.submit, pending && { opacity: 0.7 }]}
            onPress={submit}>
            <Text style={sheet.submitTxt}>
              {pending ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
            </Text>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PasswordField({
  label, value, onChange, visible, toggle, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  visible: boolean; toggle: () => void; placeholder?: string;
}) {
  return (
    <View>
      <Text style={sheet.label}>{label}</Text>
      <View style={sheet.input}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Palette.inkSoft}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={sheet.inputTxt}
        />
        <Pressable hitSlop={8} onPress={toggle}>
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={Palette.inkSoft}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 48, paddingHorizontal: 22, paddingBottom: 130, gap: 12 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  email: { fontSize: 16, color: Palette.ink, fontFamily: Fonts.arabicBold },
  role: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  card: {
    width: '100%', marginTop: 16, backgroundColor: Palette.surface, borderRadius: 20,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  rowSub: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginTop: 2 },
  signOut: {
    marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Palette.greenDk, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16,
  },
  signOutTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
});

const sheet = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,28,20,0.45)' },
  body: {
    backgroundColor: Palette.bgTop,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 24,
  },
  grabberWrap: { alignItems: 'center', paddingTop: 10 },
  grabber: { width: 42, height: 5, borderRadius: 999, backgroundColor: 'rgba(31,51,38,0.18)' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4,
  },
  eyebrow: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  title: { fontSize: 22, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.4 },
  close: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(31,51,38,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  fields: { padding: 22, gap: 12 },
  label: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginBottom: 6 },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputTxt: {
    flex: 1, fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabic,
    textAlign: 'right', padding: 0,
  },
  submit: {
    marginHorizontal: 22, marginBottom: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Palette.greenDk, paddingVertical: 14, borderRadius: 16,
  },
  submitTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
});
