import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Fonts, Palette, arDigits } from '@/constants/theme';

type OptionKey = 'remarks' | 'survey' | 'evaluation' | 'inbox';

type Option = {
  n: number;
  key: OptionKey;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  disabled?: boolean;
  badge?: string;
};

type InboxMsg = { id: number; from: string; subject: string; time: string; unread: boolean };

const INBOX: InboxMsg[] = [
  { id: 1, from: 'مؤسسة النخيل', subject: 'تحديث الأسعار للموسم الجديد', time: 'قبل ١٠ د', unread: true },
  { id: 2, from: 'مزارع الشمال', subject: 'تأكيد شحنة الأسبوع القادم', time: 'قبل ساعة', unread: true },
  { id: 3, from: 'متاجر السنبلة', subject: 'طلب عرض أسعار جديد', time: 'أمس', unread: false },
  { id: 4, from: 'إدارة المخزون', subject: 'تنبيه: انخفاض المخزون', time: 'قبل يومين', unread: false },
];

const UNREAD = INBOX.filter((m) => m.unread).length;

const OPTIONS: Option[] = [
  { n: 1, key: 'remarks', label: 'إرسال ملاحظات', desc: 'شاركنا رأيك حول التطبيق والخدمة', icon: 'chatbubble-ellipses-outline', accent: Palette.green },
  { n: 2, key: 'survey', label: 'مراجعة استبيان', desc: 'الاستبيان غير متاح حالياً', icon: 'clipboard-outline', accent: '#6a7a6e', disabled: true },
  { n: 3, key: 'evaluation', label: 'إعادة تقييم الخدمة', desc: 'قيّم تجربتك الأخيرة من جديد', icon: 'star-outline', accent: Palette.cardB },
  { n: 4, key: 'inbox', label: 'صندوق البريد', desc: 'الرسائل والتنبيهات الواردة من المورّد', icon: 'mail-outline', accent: Palette.greenDk, badge: arDigits(UNREAD) },
];

const RATE_LABELS = ['ممتاز', 'جيد جدًا', 'جيد', 'مقبول', 'ضعيف'];

function Remarks() {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    Alert.alert('تم إرسال الملاحظة', text);
    setText('');
  };
  return (
    <View style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
      <View style={rs.box}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="اكتب ملاحظاتك هنا..."
          placeholderTextColor={Palette.inkSoft}
          multiline
          style={rs.input}
        />
        <Pressable
          onPress={send}
          disabled={!text.trim()}
          style={[rs.send, !text.trim() && rs.sendDisabled]}>
          <Ionicons name="send" size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const rs = StyleSheet.create({
  box: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 10,
  },
  input: {
    flex: 1, minHeight: 60, fontSize: 13, color: Palette.ink,
    fontFamily: Fonts.arabic, textAlign: 'right', textAlignVertical: 'top',
  },
  send: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Palette.greenDk,
    alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: 'rgba(31,51,38,0.18)' },
});

function Survey() {
  return (
    <View style={ss.wrap}>
      <View style={ss.iconWrap}>
        <Ionicons name="lock-closed-outline" size={16} color={Palette.inkSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ss.title}>غير متاح</Text>
        <Text style={ss.sub}>سيتم تفعيل الاستبيان قريبًا</Text>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  wrap: {
    marginHorizontal: 14, marginBottom: 16, padding: 14, borderRadius: 14,
    backgroundColor: 'rgba(31,51,38,0.05)', borderWidth: 1, borderColor: 'rgba(31,51,38,0.18)',
    borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(31,51,38,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
  sub: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2 },
});

function Evaluation() {
  const [stars, setStars] = useState(0);
  return (
    <View style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
      <View style={es.card}>
        <Text style={es.hint}>اضغط لاختيار التقييم</Text>
        <View style={es.row}>
          {[5, 4, 3, 2, 1].map((i) => {
            const filled = i <= stars;
            return (
              <Pressable key={i} style={es.starBtn} onPress={() => setStars(i)}>
                <Ionicons
                  name={filled ? 'star' : 'star-outline'}
                  size={28}
                  color={filled ? '#f5b81c' : 'rgba(31,51,38,0.35)'}
                />
                <Text style={[es.num, filled && es.numFilled]}>{arDigits(i)}</Text>
              </Pressable>
            );
          })}
        </View>
        {stars > 0 && (
          <View style={es.result}>
            <Text style={es.resultTxt}>
              تقييمك: {RATE_LABELS[5 - stars]} ({arDigits(stars)}/{arDigits(5)})
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const es = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  hint: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabic, textAlign: 'right', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  starBtn: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6 },
  num: { fontSize: 10, color: Palette.inkSoft, fontFamily: Fonts.arabicBold, opacity: 0.7 },
  numFilled: { color: '#d59a0b', opacity: 1 },
  result: {
    marginTop: 12, padding: 10, borderRadius: 10,
    backgroundColor: 'rgba(45,90,63,0.08)', alignItems: 'center',
  },
  resultTxt: { fontSize: 12, color: Palette.green, fontFamily: Fonts.arabicBold },
});

function Inbox() {
  return (
    <View style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
      <View style={is.card}>
        {INBOX.map((m, i) => (
          <Pressable
            key={m.id}
            onPress={() => Alert.alert(m.from, m.subject)}
            style={[is.row, i > 0 && is.rowDivider]}>
            <View style={[is.dot, m.unread && is.dotUnread]} />
            <View style={{ flex: 1 }}>
              <Text style={[is.subject, m.unread && is.subjectUnread]} numberOfLines={1}>
                {m.subject}
              </Text>
              <Text style={is.meta}>{m.from} · {m.time}</Text>
            </View>
            <Ionicons name="chevron-back" size={12} color={Palette.inkSoft} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const is = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 },
  rowDivider: { borderTopWidth: 1, borderTopColor: 'rgba(31,51,38,0.10)' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'transparent' },
  dotUnread: { backgroundColor: Palette.green },
  subject: { fontSize: 12, color: Palette.ink, fontFamily: Fonts.arabicMedium },
  subjectUnread: { fontFamily: Fonts.arabicBold },
  meta: { fontSize: 10, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2 },
});

function Body({ k }: { k: OptionKey }) {
  if (k === 'remarks') return <Remarks />;
  if (k === 'survey') return <Survey />;
  if (k === 'evaluation') return <Evaluation />;
  return <Inbox />;
}

export function ReviewsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<OptionKey | null>(null);
  return (
    <BottomSheet visible={visible} onClose={onClose} eyebrow="تواصل معنا" title="المراجعات">
      <ScrollView contentContainerStyle={ms.wrap}>
        <View style={ms.list}>
          {OPTIONS.map((o, i) => {
            const isOpen = expanded === o.key;
            return (
              <View key={o.n} style={[i > 0 && ms.itemDivider, o.disabled && { opacity: 0.55 }]}>
                <Pressable
                  disabled={o.disabled}
                  onPress={() => setExpanded(isOpen ? null : o.key)}
                  style={[ms.header, isOpen && ms.headerOpen]}>
                  <View style={[ms.icon, { backgroundColor: o.accent }]}>
                    <Ionicons name={o.icon} size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={ms.titleRow}>
                      <View style={ms.num}><Text style={ms.numTxt}>{arDigits(o.n)}</Text></View>
                      <Text style={ms.label}>{o.label}</Text>
                      {o.badge && (
                        <View style={ms.badge}><Text style={ms.badgeTxt}>{o.badge}</Text></View>
                      )}
                      {o.disabled && (
                        <View style={ms.disabledTag}><Text style={ms.disabledTagTxt}>معطّل</Text></View>
                      )}
                    </View>
                    <Text style={ms.desc}>{o.desc}</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-down' : 'chevron-back'}
                    size={14}
                    color={Palette.ink}
                    style={{ opacity: 0.55 }}
                  />
                </Pressable>
                {isOpen && <Body k={o.key} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const ms = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 4 },
  list: { backgroundColor: Palette.surface, borderRadius: 20, overflow: 'hidden' },
  itemDivider: { borderTopWidth: 1, borderTopColor: Palette.lineStrong },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  headerOpen: { backgroundColor: 'rgba(45,90,63,0.06)' },
  icon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  num: { backgroundColor: 'rgba(45,90,63,0.10)', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  numTxt: { fontSize: 11, color: Palette.green, fontFamily: Fonts.arabicBold },
  label: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, letterSpacing: -0.2 },
  badge: { backgroundColor: '#c0492e', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  badgeTxt: { fontSize: 10, color: '#fff', fontFamily: Fonts.arabicBold },
  disabledTag: { backgroundColor: 'rgba(31,51,38,0.12)', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999 },
  disabledTagTxt: { fontSize: 10, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
  desc: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 4, lineHeight: 16 },
});
