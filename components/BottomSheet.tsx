import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';

export function BottomSheet({
  visible, onClose, eyebrow, title, children,
}: {
  visible: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close} hitSlop={8}>
              <Ionicons name="close" size={16} color={Palette.ink} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,28,20,0.45)' },
  sheet: {
    backgroundColor: Palette.bgTop,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 24, maxHeight: '88%',
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
});
