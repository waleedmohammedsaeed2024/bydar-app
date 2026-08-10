import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Flat, Fonts, Palette, Radius, Space } from '@/constants/theme';
import { Tap } from '@/components/Tap';

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
      <Tap style={styles.iconBtn} onPress={back} hitSlop={8}>
        <Ionicons name="arrow-back" size={20} color={Palette.ink} />
      </Tap>
      <View style={styles.center}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {trailing === 'share' ? (
        <Tap style={styles.iconBtn} hitSlop={8} onPress={onTrailingPress}>
          <Ionicons name="share-outline" size={18} color={Palette.ink} />
        </Tap>
      ) : trailing === 'filter' ? (
        <Tap style={styles.iconBtn} hitSlop={8} onPress={onTrailingPress}>
          <Ionicons name="options-outline" size={18} color={Palette.ink} />
        </Tap>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Space.screen, paddingTop: 6, paddingBottom: Space.xs,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: Radius.pill,
    ...Flat.card,
    alignItems: 'center', justifyContent: 'center',
  },
  // Keeps the title optically centred when there is no trailing action.
  spacer: { width: 44, height: 44 },
  center: { alignItems: 'center' },
  eyebrow: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  title: { fontSize: 18, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.3 },
});
