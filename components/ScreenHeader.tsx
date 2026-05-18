import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';

export function ScreenHeader({
  eyebrow,
  title,
  trailing,
  onBack,
  onTrailingPress,
}: {
  eyebrow: string;
  title: string;
  trailing?: 'share' | 'filter' | 'none';
  onBack?: () => void;
  onTrailingPress?: () => void;
}) {
  const router = useRouter();
  const back = onBack ?? (() => router.back());

  return (
    <View style={styles.row}>
      <Pressable style={styles.iconBtn} onPress={back} hitSlop={8}>
        <Ionicons name="arrow-back" size={20} color={Palette.ink} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {trailing === 'share' ? (
        <Pressable style={styles.iconBtn} hitSlop={8} onPress={onTrailingPress}>
          <Ionicons name="share-outline" size={18} color={Palette.ink} />
        </Pressable>
      ) : trailing === 'filter' ? (
        <Pressable style={styles.iconBtn} hitSlop={8} onPress={onTrailingPress}>
          <Ionicons name="options-outline" size={18} color={Palette.ink} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 6, paddingBottom: 4,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1f3326', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  center: { alignItems: 'center' },
  eyebrow: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  title: { fontSize: 18, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
});
