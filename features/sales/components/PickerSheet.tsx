import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';

export type PickerItem = { id: string; label: string; sub?: string };

export function PickerSheet({
  visible, onClose, title, eyebrow, items, loading, onSelect, searchPlaceholder = 'ابحث...',
  emptyHint = 'لا توجد نتائج', headerRight,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  eyebrow: string;
  items: PickerItem[];
  loading?: boolean;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
  emptyHint?: string;
  headerRight?: ReactNode;
}) {
  const [q, setQ] = useState('');
  const filtered = q.trim()
    ? items.filter((it) => it.label.includes(q.trim()) || (it.sub ?? '').includes(q.trim()))
    : items;

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
            {headerRight ?? (
              <Pressable onPress={onClose} style={styles.close} hitSlop={8}>
                <Ionicons name="close" size={16} color={Palette.ink} />
              </Pressable>
            )}
          </View>

          <View style={styles.searchWrap}>
            <View style={styles.search}>
              <Ionicons name="search" size={16} color={Palette.inkSoft} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={searchPlaceholder}
                placeholderTextColor={Palette.inkSoft}
                style={styles.input}
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.listWrap}>
            <View style={styles.list}>
              {loading ? (
                <View style={styles.center}><ActivityIndicator color={Palette.green} /></View>
              ) : filtered.length === 0 ? (
                <Text style={styles.empty}>{emptyHint}</Text>
              ) : (
                filtered.map((it, i) => (
                  <Pressable
                    key={it.id}
                    onPress={() => { onSelect(it.id); onClose(); }}
                    style={[styles.row, i > 0 && styles.rowDivider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label} numberOfLines={1}>{it.label}</Text>
                      {it.sub ? <Text style={styles.sub} numberOfLines={1}>{it.sub}</Text> : null}
                    </View>
                    <Ionicons name="chevron-back" size={14} color={Palette.inkSoft} />
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>
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
  searchWrap: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0 },
  listWrap: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8 },
  list: { backgroundColor: Palette.surface, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.lineStrong },
  label: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  sub: { fontSize: 11, color: Palette.inkSoft, marginTop: 2, fontFamily: Fonts.arabic },
  empty: { padding: 32, textAlign: 'center', color: Palette.inkSoft, fontSize: 13, fontFamily: Fonts.arabic },
  center: { padding: 40, alignItems: 'center' },
});
