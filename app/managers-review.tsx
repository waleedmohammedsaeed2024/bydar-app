import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AccessDenied } from '@/components/AccessDenied';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, arDigits } from '@/constants/theme';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { CLIENT_ID } from '@/lib/tenant';

// ─── types ───────────────────────────────────────────────────────────────────

type Tab = 'notes' | 'survey' | 'evaluation';

type CustomerNote = {
  id: string;
  customer_id: string;
  note_text: string;
  created_at: string;
};

type CustomerEval = {
  customer_id: string;
  rating: number;
  updated_at: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `قبل ${arDigits(diffMin)} د`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `قبل ${arDigits(diffH)} س`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'أمس';
  if (diffD < 7) return `قبل ${arDigits(diffD)} أيام`;
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase();
}

// ─── top tab bar ─────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; disabled?: boolean }[] = [
  { key: 'notes', label: 'الملاحظات' },
  { key: 'survey', label: 'الاستبيان', disabled: true },
  { key: 'evaluation', label: 'التقييم' },
];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={tb.wrap}>
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <Pressable
            key={t.key}
            disabled={t.disabled}
            onPress={() => onChange(t.key)}
            style={[tb.tab, isActive && tb.tabActive, t.disabled && tb.tabDisabled]}>
            <Text style={[tb.label, isActive && tb.labelActive, t.disabled && tb.labelDisabled]}>
              {t.label}
            </Text>
            {t.disabled && (
              <View style={tb.disabledDot} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  tabActive: { backgroundColor: Palette.greenDk },
  tabDisabled: { opacity: 0.45 },
  label: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  labelActive: { color: '#fff', fontFamily: Fonts.arabicBold },
  labelDisabled: {},
  disabledDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Palette.inkSoft,
  },
});

// ─── notes tab ───────────────────────────────────────────────────────────────

function NotesTab() {
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    supabase
      .from('customer_note')
      .select('id, customer_id, note_text, created_at')
      .eq('client_id', CLIENT_ID)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error: err }) => {
        if (!mounted) return;
        if (err) { setError(true); } else { setNotes(data ?? []); }
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <View style={shared.center}><ActivityIndicator color={Palette.greenDk} /></View>;
  }
  if (error) {
    return (
      <View style={shared.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Palette.inkSoft} />
        <Text style={shared.emptyTxt}>تعذّر تحميل الملاحظات</Text>
      </View>
    );
  }
  if (notes.length === 0) {
    return (
      <View style={shared.center}>
        <Ionicons name="chatbubble-ellipses-outline" size={36} color={Palette.inkSoft} style={{ opacity: 0.4 }} />
        <Text style={shared.emptyTxt}>لا توجد ملاحظات بعد</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notes}
      keyExtractor={(n) => n.id}
      contentContainerStyle={nt.list}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={nt.sep} />}
      renderItem={({ item }) => (
        <View style={nt.card}>
          <View style={nt.cardHeader}>
            <View style={nt.badge}>
              <Ionicons name="person-outline" size={10} color={Palette.green} />
              <Text style={nt.badgeTxt}>{shortId(item.customer_id)}</Text>
            </View>
            <Text style={nt.time}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={nt.body}>{item.note_text}</Text>
        </View>
      )}
    />
  );
}

const nt = StyleSheet.create({
  list: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 130 },
  sep: { height: 8 },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: 16,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(45,90,63,0.10)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  badgeTxt: { fontSize: 10, color: Palette.green, fontFamily: Fonts.arabicBold },
  time: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic },
  body: {
    fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabic,
    lineHeight: 22, textAlign: 'right',
  },
});

// ─── survey tab ──────────────────────────────────────────────────────────────

function SurveyTab() {
  return (
    <View style={shared.center}>
      <View style={sv.iconWrap}>
        <Ionicons name="lock-closed-outline" size={28} color={Palette.inkSoft} />
      </View>
      <Text style={sv.title}>الاستبيان غير متاح</Text>
      <Text style={sv.sub}>سيتم تفعيل الاستبيان قريبًا</Text>
    </View>
  );
}

const sv = StyleSheet.create({
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(31,51,38,0.07)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 15, color: Palette.ink, fontFamily: Fonts.arabicBold, marginBottom: 4 },
  sub: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabic },
});

// ─── evaluation tab ───────────────────────────────────────────────────────────

const RATE_LABELS: Record<number, string> = {
  5: 'ممتاز', 4: 'جيد جدًا', 3: 'جيد', 2: 'مقبول', 1: 'ضعيف',
};

function Stars({ rating, size = 22 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i <= Math.round(rating) ? '#f5b81c' : 'rgba(31,51,38,0.25)'}
        />
      ))}
    </View>
  );
}

function EvaluationTab({ isAdmin }: { isAdmin: boolean }) {
  const [evals, setEvals] = useState<CustomerEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    supabase
      .from('customer_evaluation')
      .select('customer_id, rating, updated_at')
      .eq('client_id', CLIENT_ID)
      .order('updated_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!mounted) return;
        if (err) { setError(true); } else { setEvals(data ?? []); }
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <View style={shared.center}><ActivityIndicator color={Palette.greenDk} /></View>;
  }
  if (error) {
    return (
      <View style={shared.center}>
        <Ionicons name="alert-circle-outline" size={32} color={Palette.inkSoft} />
        <Text style={shared.emptyTxt}>تعذّر تحميل التقييمات</Text>
      </View>
    );
  }

  const count = evals.length;
  const avg = count > 0 ? evals.reduce((s, e) => s + e.rating, 0) / count : 0;
  const label = avg > 0 ? RATE_LABELS[Math.round(avg)] ?? '' : '—';

  // distribution
  const dist = [5, 4, 3, 2, 1].map((r) => ({
    r,
    n: evals.filter((e) => e.rating === r).length,
  }));

  return (
    <FlatList
      data={isAdmin ? evals : []}
      keyExtractor={(e) => e.customer_id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 130 }}
      ListHeaderComponent={
        <View style={{ gap: 12, paddingTop: 10 }}>
          {/* average card */}
          <View style={ev.avgCard}>
            <Text style={ev.avgEyebrow}>متوسط التقييم العام</Text>
            <View style={ev.avgRow}>
              <Text style={ev.avgNum}>{avg > 0 ? arDigits(avg.toFixed(1)) : '—'}</Text>
              <View style={{ gap: 6 }}>
                <Stars rating={avg} size={20} />
                <Text style={ev.avgLabel}>{label}</Text>
              </View>
            </View>
            <Text style={ev.avgCount}>{arDigits(count)} تقييم</Text>
            {/* bar chart */}
            <View style={ev.distWrap}>
              {dist.map(({ r, n }) => {
                const pct = count > 0 ? n / count : 0;
                return (
                  <View key={r} style={ev.distRow}>
                    <Text style={ev.distLabel}>{arDigits(r)}</Text>
                    <View style={ev.barTrack}>
                      <View style={[ev.barFill, { flex: pct }]} />
                      <View style={{ flex: 1 - pct }} />
                    </View>
                    <Text style={ev.distCount}>{arDigits(n)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* admin section header */}
          {isAdmin && count > 0 && (
            <View style={ev.adminHeader}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Palette.green} />
              <Text style={ev.adminHeaderTxt}>تفاصيل تقييمات العملاء</Text>
            </View>
          )}
          {isAdmin && count === 0 && (
            <View style={shared.center}>
              <Ionicons name="star-outline" size={36} color={Palette.inkSoft} style={{ opacity: 0.4 }} />
              <Text style={shared.emptyTxt}>لا توجد تقييمات بعد</Text>
            </View>
          )}
          {!isAdmin && (
            <View style={ev.adminLocked}>
              <Ionicons name="lock-closed-outline" size={14} color={Palette.inkSoft} />
              <Text style={ev.adminLockedTxt}>تفاصيل التقييمات متاحة للمدير فقط</Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={[ev.row, index > 0 && ev.rowDivider]}>
          <View style={ev.rowLeft}>
            <View style={ev.rowBadge}>
              <Text style={ev.rowBadgeTxt}>{shortId(item.customer_id)}</Text>
            </View>
            <Text style={ev.rowTime}>{formatDate(item.updated_at)}</Text>
          </View>
          <Stars rating={item.rating} size={14} />
        </View>
      )}
    />
  );
}

const ev = StyleSheet.create({
  avgCard: {
    backgroundColor: Palette.surface,
    borderRadius: 20, padding: 18,
  },
  avgEyebrow: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginBottom: 10 },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  avgNum: { fontSize: 42, color: Palette.greenDk, fontFamily: Fonts.arabicBold, letterSpacing: -1 },
  avgLabel: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  avgCount: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginBottom: 14 },
  distWrap: { gap: 6 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distLabel: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicBold, width: 14, textAlign: 'center' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, flexDirection: 'row', backgroundColor: 'rgba(31,51,38,0.08)', overflow: 'hidden' },
  barFill: { backgroundColor: Palette.green, borderRadius: 3 },
  distCount: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, width: 20, textAlign: 'left' },
  adminHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 4,
  },
  adminHeaderTxt: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
  adminLocked: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(31,51,38,0.05)',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(31,51,38,0.10)',
    borderStyle: 'dashed',
  },
  adminLockedTxt: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  row: {
    backgroundColor: Palette.surface,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 0,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: 'rgba(31,51,38,0.08)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBadge: {
    backgroundColor: 'rgba(45,90,63,0.10)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  rowBadgeTxt: { fontSize: 10, color: Palette.green, fontFamily: Fonts.arabicBold },
  rowTime: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic },
});

// ─── shared styles ────────────────────────────────────────────────────────────

const shared = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
  emptyTxt: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
});

// ─── screen ───────────────────────────────────────────────────────────────────

export default function ManagersReviewScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const { role, can } = usePermissions();
  const isAdmin = role === 'admin';

  if (!can('view_reviews') || role === 'customer') return <AccessDenied />;

  const renderContent = () => {
    if (activeTab === 'notes') return <NotesTab />;
    if (activeTab === 'survey') return <SurveyTab />;
    return <EvaluationTab isAdmin={isAdmin} />;
  };

  return (
    <Screen>
      <OfflineBanner />
      <ScreenHeader eyebrow="إدارة التغذية الراجعة" title="مراجعات المدير" />
      <TabBar active={activeTab} onChange={setActiveTab} />
      {renderContent()}
    </Screen>
  );
}
