import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { z } from 'zod';

import { Screen } from '@/components/Screen';
import { Tap } from '@/components/Tap';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, Radius } from '@/constants/theme';
import { useCreateCustomer } from '@/features/partners/partners.hooks';
import { CLIENT_ID } from '@/lib/tenant';

const schema = z.object({
  partner_name: z.string().trim().min(1, 'الاسم مطلوب'),
  phone_no: z.string().trim().nullable(),
});

export default function NewCustomerScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const create = useCreateCustomer();

  const submit = async () => {
    const parsed = schema.safeParse({
      partner_name: name,
      phone_no: phone.trim() || null,
    });
    if (!parsed.success) {
      Alert.alert('بيانات ناقصة', parsed.error.issues[0]?.message ?? '');
      return;
    }
    try {
      await create.mutateAsync({
        partner_name: parsed.data.partner_name,
        phone_no: parsed.data.phone_no,
        client_id: CLIENT_ID,
      });
      router.back();
    } catch (e) {
      Alert.alert('فشل الحفظ', e instanceof Error ? e.message : 'خطأ غير معروف');
    }
  };

  return (
    <Screen>
      <ScreenHeader eyebrow="الزبائن" title="زبون جديد" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Field label="الاسم" required>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="اسم الزبون"
              placeholderTextColor={Palette.inkSoft}
              style={styles.input}
            />
          </Field>

          <Field label="رقم الجوال">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="05xxxxxxxx"
              placeholderTextColor={Palette.inkSoft}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Field>
        </ScrollView>

        <View style={styles.footer}>
          <Tap
            disabled={create.isPending}
            style={[styles.btn, create.isPending && { opacity: 0.7 }]}
            onPress={submit}>
            <Text style={styles.btnTxt}>{create.isPending ? 'جارٍ الحفظ...' : 'حفظ الزبون'}</Text>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </Tap>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      <View style={styles.field}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 120, gap: 12 },
  label: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginBottom: 6 },
  field: {
    backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Palette.line,
  },
  input: {
    fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0,
  },
  footer: {
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 22,
    backgroundColor: Palette.bgBottom,
    borderTopWidth: 1, borderTopColor: Palette.line,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Palette.greenDk,
  },
  btnTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
});
