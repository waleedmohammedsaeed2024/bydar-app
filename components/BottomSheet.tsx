import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Palette, Radius, Space } from '@/constants/theme';
import { Tap } from '@/components/Tap';

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
        {/* Plain Pressable: a backdrop should dim the scene, not react to touch. */}
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
            <Tap onPress={onClose} style={styles.close} hitSlop={8}>
              <Ionicons name="close" size={16} color={Palette.ink} />
            </Tap>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,28,20,0.38)' },
  sheet: {
    backgroundColor: Palette.bgTop,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingBottom: 24, maxHeight: '88%',
  },
  grabberWrap: { alignItems: 'center', paddingTop: 10 },
  grabber: { width: 42, height: 5, borderRadius: Radius.pill, backgroundColor: Palette.tintStrong },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Space.screen, paddingTop: 14, paddingBottom: Space.xs,
  },
  eyebrow: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  title: { fontSize: 22, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.4 },
  close: {
    width: 36, height: 36, borderRadius: Radius.pill, backgroundColor: Palette.tint,
    alignItems: 'center', justifyContent: 'center',
  },
});
