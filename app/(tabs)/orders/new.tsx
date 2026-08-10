// NOTE: plan §5.4 specifies three separate routes (header / lines / review)
// using NewOrderHeaderScreen etc. We use a single screen with a 3-step
// stepper to keep wizard state co-located without a shared store. Convert
// to separate routes when this wizard needs deep-linking or back-stack
// per-step navigation.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { z } from 'zod';

import { AccessDenied } from '@/components/AccessDenied';
import { Tap } from '@/components/Tap';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, Radius } from '@/constants/theme';
import { useCustomers } from '@/features/partners/partners.hooks';
import { useItems } from '@/features/items/items.hooks';
import { PickerSheet } from '@/features/sales/components/PickerSheet';
import { useCreateSalesOrder } from '@/features/sales/sales.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import type { InventoryItem, Packaging } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { CLIENT_ID } from '@/lib/tenant';
import { isHalfStep, itemPackagings, snapQty, type QtyStep } from '@/lib/utils';
import { QtyStepper, QtyText } from '@/components/QtyStepper';
import { useAuthStore } from '@/stores/auth';

const headerSchema = z.object({
  customer_id: z.string().min(1, 'الزبون مطلوب'),
  site: z.string().nullable(),
  description: z.string().nullable(),
});

type DraftLine = {
  uid: string;
  item: InventoryItem;
  packaging: Packaging | null;
  quantity: number;
  /** 1 = whole units (default), 0.5 = half units. Per line, per packaging. */
  step: QtyStep;
};

const lineSchema = z.object({
  item_id: z.string().min(1),
  packaging_id: z.string().nullable(),
  quantity: z.number()
    .positive('الكمية يجب أن تكون أكبر من صفر')
    .refine(isHalfStep, 'الكمية يجب أن تكون من مضاعفات 0.5'),
});

export default function NewOrderScreen() {
  const router = useRouter();
  const { can, isCustomer } = usePermissions();
  const authUser = useAuthStore((s) => s.user);
  const tabBarHeight = useTabBarHeight();

  const [step, setStep] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(isCustomer);
  const [profileMissing, setProfileMissing] = useState(false);
  const [site, setSite] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  // For customer role: auto-load their partner_id + name from user_profiles
  useEffect(() => {
    if (!isCustomer || !authUser?.id) return;
    supabase
      .from('user_profiles')
      .select('partner_id, partner:partner_id(partner_name)')
      .eq('id', authUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.partner_id) {
          setCustomerId(data.partner_id);
          const name = (data as unknown as { partner?: { partner_name?: string } }).partner?.partner_name ?? null;
          setCustomerName(name);
        } else {
          setProfileMissing(true);
        }
        setProfileLoading(false);
      });
  }, [isCustomer, authUser?.id]);

  const customers = useCustomers(CLIENT_ID);
  const items = useItems();
  const createOrder = useCreateSalesOrder();

  if (!can('create_order')) return <AccessDenied />;

  if (isCustomer && profileLoading) {
    return (
      <Screen>
        <ScreenHeader eyebrow="طلب جديد" title="جارٍ التحميل..." />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Palette.greenDk} />
        </View>
      </Screen>
    );
  }

  if (isCustomer && profileMissing) {
    return (
      <Screen>
        <ScreenHeader eyebrow="طلب جديد" title="غير مرتبط" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 }}>
          <Ionicons name="alert-circle-outline" size={42} color={Palette.inkSoft} />
          <Text style={{ fontSize: 15, color: Palette.ink, fontFamily: Fonts.arabicBold, textAlign: 'center' }}>
            الحساب غير مرتبط بزبون
          </Text>
          <Text style={{ fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabic, textAlign: 'center', lineHeight: 20 }}>
            يرجى التواصل مع المسؤول لربط حسابك بسجل الزبون
          </Text>
        </View>
      </Screen>
    );
  }

  const next = () => {
    if (step === 0) {
      const parsed = headerSchema.safeParse({
        customer_id: customerId ?? '',
        site: site || null,
        description: description || null,
      });
      if (!parsed.success) {
        Alert.alert('بيانات ناقصة', parsed.error.issues[0]?.message ?? '');
        return;
      }
    }
    if (step === 1) {
      if (lines.length === 0) {
        Alert.alert('بدون أصناف', 'أضف صنفًا واحدًا على الأقل قبل المتابعة');
        return;
      }
      for (const l of lines) {
        const r = lineSchema.safeParse({
          item_id: l.item.id,
          packaging_id: l.packaging?.id ?? null,
          quantity: l.quantity,
        });
        if (!r.success) {
          Alert.alert('سطر غير صحيح', r.error.issues[0]?.message ?? '');
          return;
        }
        if (itemPackagings(l.item).length > 0 && !l.packaging) {
          Alert.alert('التعبئة مطلوبة', `اختر تعبئة لصنف ${l.item.item_name}`);
          return;
        }
      }
    }
    setStep((s) => Math.min(2, s + 1));
  };

  const submit = async () => {
    try {
      const res = await createOrder.mutateAsync({
        customer_id: customerId!,
        site: site || null,
        description: description || null,
        lines: lines.map((l) => ({
          item_id: l.item.id,
          packaging_id: l.packaging?.id ?? null,
          quantity: l.quantity,
          avg_cost: l.item.avg_cost,
        })),
      });
      router.replace({ pathname: '/orders/[id]', params: { id: res.id } });
    } catch (e) {
      Alert.alert('فشل الإرسال', e instanceof Error ? e.message : 'خطأ غير معروف');
    }
  };

  const titles = ['البيانات الرئيسية', 'الأصناف', 'المراجعة'];

  return (
    <Screen>
      <ScreenHeader eyebrow={`الخطوة ${step + 1} من 3`} title={titles[step]} />
      <Stepper step={step} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <HeaderStep
              customers={customers}
              customerId={customerId}
              customerName={customerName}
              isCustomer={isCustomer}
              site={site}
              description={description}
              setCustomerId={setCustomerId}
              setSite={setSite}
              setDescription={setDescription}
            />
          )}
          {step === 1 && (
            <LinesStep
              items={items.data ?? []}
              loading={items.isLoading}
              lines={lines}
              setLines={setLines}
            />
          )}
          {step === 2 && (
            <ReviewStep
              customerLabel={
                customers.data?.find((c) => c.id === customerId)?.partner_name
                ?? customerName
                ?? '—'
              }
              site={site}
              description={description}
              lines={lines}
            />
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: tabBarHeight + 10 }]}>
          {step > 0 && (
            <Tap
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => setStep((s) => Math.max(0, s - 1))}>
              <Text style={styles.btnSecondaryTxt}>السابق</Text>
            </Tap>
          )}
          {step < 2 ? (
            <Tap style={[styles.btn, styles.btnPrimary]} onPress={next}>
              <Text style={styles.btnPrimaryTxt}>التالي</Text>
              <Ionicons name="arrow-back" size={16} color="#fff" />
            </Tap>
          ) : (
            <Tap
              disabled={createOrder.isPending}
              style={[styles.btn, styles.btnPrimary, createOrder.isPending && { opacity: 0.7 }]}
              onPress={submit}>
              <Text style={styles.btnPrimaryTxt}>{createOrder.isPending ? 'جارٍ الإرسال...' : 'إرسال الطلب'}</Text>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </Tap>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <View style={stepperStyles.row}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[stepperStyles.dot, i <= step && stepperStyles.dotActive]} />
      ))}
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 8 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(31,51,38,0.15)' },
  dotActive: { backgroundColor: Palette.green },
});

function HeaderStep({
  customers, customerId, customerName, isCustomer, site, description,
  setCustomerId, setSite, setDescription,
}: {
  customers: ReturnType<typeof useCustomers>;
  customerId: string | null;
  customerName: string | null;
  isCustomer: boolean;
  site: string;
  description: string;
  setCustomerId: (id: string) => void;
  setSite: (v: string) => void;
  setDescription: (v: string) => void;
}) {
  const [showCustomers, setShowCustomers] = useState(false);
  const resolvedLabel =
    customers.data?.find((c) => c.id === customerId)?.partner_name
    ?? customerName
    ?? null;

  return (
    <View style={{ gap: 12 }}>
      {isCustomer ? (
        // Customer role: locked read-only display of their own name
        <View>
          <Text style={fieldStyles.label}>الزبون</Text>
          <View style={[fieldStyles.field, { opacity: 0.8 }]}>
            <Text style={fieldStyles.value}>{resolvedLabel ?? '—'}</Text>
            <Ionicons name="lock-closed-outline" size={14} color={Palette.inkSoft} />
          </View>
        </View>
      ) : (
        <FieldButton
          label="الزبون"
          value={resolvedLabel}
          placeholder="اختر زبونًا"
          onPress={() => setShowCustomers(true)}
        />
      )}
      <TextField
        label="الموقع"
        value={site}
        onChange={setSite}
        placeholder="موقع التسليم (اختياري)"
      />
      <TextField
        label="ملاحظات"
        value={description}
        onChange={setDescription}
        placeholder="ملاحظات (اختياري)"
        multiline
      />

      {!isCustomer && (
        <PickerSheet
          visible={showCustomers}
          onClose={() => setShowCustomers(false)}
          eyebrow="اختيار"
          title="الزبائن"
          loading={customers.isLoading}
          items={(customers.data ?? []).map((c) => ({ id: c.id, label: c.partner_name, sub: c.phone_no ?? undefined }))}
          onSelect={setCustomerId}
        />
      )}
    </View>
  );
}

function LinesStep({
  items, loading, lines, setLines,
}: {
  items: InventoryItem[];
  loading: boolean;
  lines: DraftLine[];
  setLines: (next: DraftLine[]) => void;
}) {
  const [showItems, setShowItems] = useState(false);

  const addItem = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const def = itemPackagings(it)[0] ?? null;
    setLines([
      ...lines,
      // New lines always start on whole numbers; the switch opts into halves.
      { uid: `${id}-${Date.now()}`, item: it, packaging: def, quantity: 1, step: 1 },
    ]);
  };

  const update = (uid: string, patch: Partial<DraftLine>) =>
    setLines(lines.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));
  const remove = (uid: string) => setLines(lines.filter((l) => l.uid !== uid));

  return (
    <View style={{ gap: 12 }}>
      <Tap style={lineStyles.addBtn} onPress={() => setShowItems(true)}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={lineStyles.addTxt}>إضافة صنف</Text>
      </Tap>

      {lines.length === 0 ? (
        <Text style={lineStyles.empty}>لم تتم إضافة أي صنف بعد</Text>
      ) : (
        lines.map((l) => {
          const packs = itemPackagings(l.item);
          return (
          <View key={l.uid} style={lineStyles.card}>
            <View style={lineStyles.row}>
              <Text style={lineStyles.name}>{l.item.item_name}</Text>
              <Tap hitSlop={8} onPress={() => remove(l.uid)}>
                <Ionicons name="close-circle" size={20} color={Palette.danger} />
              </Tap>
            </View>

            {packs.length > 0 && (
              <View style={lineStyles.pkgs}>
                {packs.map((p) => {
                  const sel = p.id === l.packaging?.id;
                  return (
                    <Tap
                      key={p.id}
                      onPress={() => update(l.uid, { packaging: p })}
                      style={[lineStyles.pkg, sel && lineStyles.pkgSel]}>
                      <Text style={[lineStyles.pkgTxt, sel && lineStyles.pkgTxtSel]}>{p.pack_arab}</Text>
                    </Tap>
                  );
                })}
              </View>
            )}

            <View style={lineStyles.qtyRow}>
              <QtyStepper
                value={l.quantity}
                step={l.step}
                onChange={(quantity) => update(l.uid, { quantity })}
                onStepChange={(step) =>
                  // Back to whole units: round the current quantity so the
                  // line never sits on a half it can no longer reach.
                  update(l.uid, { step, quantity: snapQty(l.quantity, step) })
                }
              />
            </View>
          </View>
          );
        })
      )}

      <PickerSheet
        visible={showItems}
        onClose={() => setShowItems(false)}
        eyebrow="اختيار"
        title="الأصناف"
        loading={loading}
        items={items.map((i) => ({ id: i.id, label: i.item_name }))}
        onSelect={addItem}
      />
    </View>
  );
}

function ReviewStep({
  customerLabel, site, description, lines,
}: {
  customerLabel: string;
  site: string;
  description: string;
  lines: DraftLine[];
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={reviewStyles.card}>
        <SummaryRow label="الزبون" value={customerLabel} />
        {site && <SummaryRow label="الموقع" value={site} />}
        {description && <SummaryRow label="ملاحظات" value={description} />}
      </View>

      <Text style={reviewStyles.section}>الأصناف ({lines.length})</Text>
      <View style={reviewStyles.card}>
        {lines.map((l, i) => (
          <View key={l.uid} style={[reviewStyles.line, i > 0 && reviewStyles.lineDivider]}>
            <View style={{ flex: 1 }}>
              <Text style={reviewStyles.lineName}>{l.item.item_name}</Text>
              <Text style={reviewStyles.lineMeta}>
                <QtyText value={l.quantity} style={reviewStyles.lineQty} />
                × {l.packaging?.pack_arab ?? ''}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={reviewStyles.summaryRow}>
      <Text style={reviewStyles.summaryLabel}>{label}</Text>
      <Text style={reviewStyles.summaryValue}>{value}</Text>
    </View>
  );
}

function FieldButton({
  label, value, placeholder, onPress, disabled,
}: {
  label: string; value: string | null; placeholder: string;
  onPress: () => void; disabled?: boolean;
}) {
  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <Tap
        disabled={disabled}
        style={[fieldStyles.field, disabled && { opacity: 0.55 }]}
        onPress={onPress}>
        <Text style={value ? fieldStyles.value : fieldStyles.placeholder}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-back" size={14} color={Palette.inkSoft} />
      </Tap>
    </View>
  );
}

function TextField({
  label, value, onChange, placeholder, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={[fieldStyles.field, multiline && { minHeight: 80, alignItems: 'flex-start' }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Palette.inkSoft}
          multiline={multiline}
          style={[fieldStyles.input, multiline && { textAlignVertical: 'top' }]}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium, marginBottom: 6 },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: Palette.line,
  },
  value: { flex: 1, fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right' },
  placeholder: { flex: 1, fontSize: 14, color: Palette.inkSoft, fontFamily: Fonts.arabic, textAlign: 'right' },
  input: { flex: 1, fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabic, textAlign: 'right', padding: 0 },
});

const lineStyles = StyleSheet.create({
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Palette.greenDk, paddingVertical: 12, borderRadius: Radius.md,
  },
  addTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
  empty: { textAlign: 'center', color: Palette.inkSoft, fontFamily: Fonts.arabic, padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: Radius.md, padding: 14, gap: 10, borderWidth: 1, borderColor: Palette.line },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, color: Palette.ink, fontFamily: Fonts.arabicBold, flex: 1 },
  pkgs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pkg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.lineStrong },
  pkgSel: { backgroundColor: Palette.greenDk, borderColor: Palette.greenDk },
  pkgTxt: { fontSize: 11, color: Palette.ink, fontFamily: Fonts.arabicBold },
  pkgTxtSel: { color: '#fff' },
  qtyRow: { paddingTop: 6, borderTopWidth: 1, borderTopColor: Palette.line },
  lineTotal: { marginLeft: 'auto', fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
});

const reviewStyles = StyleSheet.create({
  card: { backgroundColor: Palette.surface, borderRadius: Radius.lg, padding: 14, gap: 8, borderWidth: 1, borderColor: Palette.line },
  section: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { fontSize: 12, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  summaryValue: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold, flexShrink: 1, textAlign: 'left' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  lineDivider: { borderTopWidth: 1, borderTopColor: Palette.line },
  lineName: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  lineMeta: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabic, marginTop: 2 },
  lineQty: { fontSize: 11, color: Palette.ink, fontFamily: Fonts.arabicBold },
  lineAmt: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
  totalLine: { borderTopWidth: 1, borderTopColor: Palette.lineStrong, justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
  totalAmt: { fontSize: 16, color: Palette.ink, fontFamily: Fonts.arabicBold },
});

const styles = StyleSheet.create({
  // Footer reserves its own space below the ScrollView, so the body only
  // needs breathing room, not tab-bar clearance.
  body: { padding: 22, paddingBottom: 32 },
  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 22, paddingTop: 8,
    backgroundColor: Palette.bgBottom,
    borderTopWidth: 1, borderTopColor: Palette.line,
  },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: Radius.md,
  },
  btnPrimary: { backgroundColor: Palette.greenDk },
  btnPrimaryTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: Palette.line },
  btnSecondaryTxt: { color: Palette.ink, fontSize: 14, fontFamily: Fonts.arabicBold },
});
