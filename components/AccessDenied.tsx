import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Fonts, Palette } from '@/constants/theme';

export function AccessDenied() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={38} color={Palette.greenDk} />
        </View>
        <Text style={styles.title}>غير مصرّح بالوصول</Text>
        <Text style={styles.sub}>ليس لديك صلاحية لعرض هذه الصفحة</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text style={styles.btnTxt}>العودة</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 12,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Palette.cardA,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20, color: Palette.ink,
    fontFamily: Fonts.arabicBold, letterSpacing: -0.3, textAlign: 'center',
  },
  sub: {
    fontSize: 13, color: Palette.inkSoft,
    fontFamily: Fonts.arabic, textAlign: 'center', lineHeight: 20,
  },
  btn: {
    marginTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Palette.greenDk,
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14,
  },
  btnTxt: { fontSize: 14, color: '#fff', fontFamily: Fonts.arabicBold },
});
