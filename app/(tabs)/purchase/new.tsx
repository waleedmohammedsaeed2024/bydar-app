import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { z } from 'zod';

import { AccessDenied } from '@/components/AccessDenied';
import { Tap } from '@/components/Tap';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Fonts, Palette, Radius, arDigits, arMonths } from '@/constants/theme';
import { useItems } from '@/features/items/items.hooks';
import { useSuppliers } from '@/features/partners/partners.hooks';
import { PickerSheet } from '@/features/sales/components/PickerSheet';
import { useCreatePurchaseInvoice } from '@/features/purchases/purchases.hooks';
import { usePermissions } from '@/hooks/usePermissions';
import type { InventoryItem, Packaging } from '@/lib/database.types';
import { formatCurrency, itemPackagings } from '@/lib/utils';
import { useNotificationsStore } from '@/stores/notifications';

type DraftLine = {
  uid: string;
  item: InventoryItem;
  packaging: Packaging | null;
  quantity: number;
  cost: number;
};

const lineSchema = z.object({
  item_id: z.string().min(1),
  packaging_id: z.string().nullable(),
  quantity: z.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  cost: z.number().nonnegative('السعر غير صحيح'),
});

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function arDate(iso: string): string {
  const d = new Date(iso);
  return `${arDigits(d.getDate())} ${arMonths[d.getMonth()]} ${arDigits(d.getFullYear())}`;
}

export default function NewPurchaseScreen() {
  const { can } = usePermissions();
  const router = useRouter();
  const pushPurchase = useNotificationsStore((s) => s.pushPurchase);

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierInvNo, setSupplierInvNo] = useState('');
  const [date, setDate] = useState<string>(toISODate(new Date()));
  const [lines, setLines] = useState<DraftLine[]>([]);

  const suppliers = useSuppliers();
  const items = useItems();
  const create = useCreatePurchaseInvoice();

  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showItems, setShowItems] = useState(false);

  if (!can('create_purchase')) return <AccessDenied />;

  const supplierLabel =
    suppliers.data?.find((s) => s.id === supplierId)?.partner_name ?? null;

  const total = useMemo(
    () => lines.reduce((s, l) => s + l.quantity * l.cost, 0),
    [lines],
  );

  const addItem = (id: string) => {
    const it = items.data?.find((i) => i.id === id);
    if (!it) return;
    const def = itemPackagings(it)[0] ?? null;
    setLines((prev) => [
      ...prev,
      { uid: `${id}-${Date.now()}`, item: it, packaging: def, quantity: 1, cost: Number(it.avg_cost) || 0 },
    ]);
  };

  const update = (uid: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.uid === uid ? { ...l, ...patch } : l)));

  const remove = (uid: string) =>
    setLines((prev) => prev.filter((l) => l.uid !== uid));

  const shiftDate = (deltaDays: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + deltaDays);
    setDate(toISODate(d));
  };

  const submit = async () => {
    if (!supplierId) {
      Alert.alert('بيانات ناقصة', 'اختر موردًا');
      return;
    }
    if (lines.length === 0) {
      Alert.alert('بدون أصناف', 'أضف صنفًا واحدًا على الأقل');
      return;
    }
    for (const l of lines) {
      const r = lineSchema.safeParse({
        item_id: l.item.id,
        packaging_id: l.packaging?.id ?? null,
        quantity: l.quantity,
        cost: l.cost,
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
    try {
      const res = await create.mutateAsync({
        supplier_id: supplierId,
        supplier_inv_no: supplierInvNo.trim() || null,
        invoice_date: new Date(`${date}T12:00:00`).toISOString(),
        lines: lines.map((l) => ({
          item_id: l.item.id,
          packaging_id: l.packaging?.id ?? null,
          quantity: l.quantity,
          item_cost: l.cost,
        })),
      });
      pushPurchase(res.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace({ pathname: '/purchase', params: { created: res.id } } as any);
    } catch (e) {
      Alert.alert('فشل الإرسال', e instanceof Error ? e.message : 'خطأ غير معروف');
    }
  };

  return (
    <Screen>
      <ScreenHeader eyebrow="إضافة" title="فاتورة شراء جديدة" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <FieldButton
            label="المورد"
            value={supplierLabel}
            placeholder="اختر موردًا"
            onPress={() => setShowSuppliers(true)}
          />
          <TextField
            label="رقم فاتورة المورد"
            value={supplierInvNo}
            onChange={setSupplierInvNo}
            placeholder="اختياري"
          />

          <View>
            <Text style={fieldStyles.label}>تاريخ الفاتورة</Text>
            <View style={dateStyles.row}>
              <Tap style={dateStyles.btn} onPress={() => shiftDate(-1)}>
                <Ionicons name="chevron-forward" size={16} color={Palette.ink} />
              </Tap>
              <View style={dateStyles.center}>
                <Text style={dateStyles.value}>{arDate(date)}</Text>
                {date === toISODate(new Date()) && <Text style={dateStyles.todayTag}>اليوم</Text>}
              </View>
              <Tap style={dateStyles.btn} onPress={() => shiftDate(1)}>
                <Ionicons name="chevron-back" size={16} color={Palette.ink} />
              </Tap>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>الأصناف ({arDigits(lines.length)})</Text>
            <Tap style={styles.addBtn} onPress={() => setShowItems(true)}>
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={styles.addTxt}>إضافة صنف</Text>
            </Tap>
          </View>

          {lines.length === 0 ? (
            <Text style={lineStyles.empty}>لم تتم إضافة أي صنف بعد</Text>
          ) : (
            lines.map((l) => {
              const packs = itemPackagings(l.item);
              return (
                <View key={l.uid} style={lineStyles.card}>
                  <View style={lineStyles.row}>
                    <Text style={lineStyles.name} numberOfLines={1}>{l.item.item_name}</Text>
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
                    <View style={lineStyles.qtyBox}>
                      <Tap
                        style={lineStyles.qtyBtn}
                        onPress={() => update(l.uid, { quantity: Math.max(1, Math.floor(l.quantity - 1)) })}>
                        <Text style={lineStyles.qtyBtnTxt}>−</Text>
                      </Tap>
                      <TextInput
                        value={String(l.quantity)}
                        onChangeText={(t) => {
                          const n = Number(t.replace(/[^\d.]/g, ''));
                          update(l.uid, { quantity: Number.isFinite(n) && n > 0 ? n : 1 });
                        }}
                        keyboardType="decimal-pad"
                        style={lineStyles.qtyInput}
                      />
                      <Tap
                        style={[lineStyles.qtyBtn, lineStyles.qtyBtnPlus]}
                        onPress={() => update(l.uid, { quantity: l.quantity + 1 })}>
                        <Text style={lineStyles.qtyBtnPlusTxt}>＋</Text>
                      </Tap>
                    </View>

                    <View style={lineStyles.priceBox}>
                      <Text style={lineStyles.priceLabel}>السعر</Text>
                      <TextInput
                        value={String(l.cost)}
                        onChangeText={(t) => {
                          const n = Number(t.replace(/[^\d.]/g, ''));
                          update(l.uid, { cost: Number.isFinite(n) ? n : 0 });
                        }}
                        keyboardType="decimal-pad"
                        style={lineStyles.priceInput}
                      />
                    </View>
                  </View>

                  <View style={lineStyles.totalRow}>
                    <Text style={lineStyles.totalLabel}>إجمالي السطر</Text>
                    <Text style={lineStyles.totalValue}>{formatCurrency(l.quantity * l.cost)}</Text>
                  </View>
                </View>
              );
            })
          )}

          {lines.length > 0 && (
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>الإجمالي الكلي</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Tap
            disabled={create.isPending}
            style={[styles.btn, styles.btnPrimary, create.isPending && { opacity: 0.7 }]}
            onPress={submit}>
            <Text style={styles.btnPrimaryTxt}>
              {create.isPending ? 'جارٍ الحفظ...' : 'حفظ الفاتورة'}
            </Text>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </Tap>
        </View>
      </KeyboardAvoidingView>

      <PickerSheet
        visible={showSuppliers}
        onClose={() => setShowSuppliers(false)}
        eyebrow="اختيار"
        title="الموردون"
        loading={suppliers.isLoading}
        items={(suppliers.data ?? []).map((s) => ({
          id: s.id, label: s.partner_name, sub: s.phone_no ?? undefined,
        }))}
        onSelect={setSupplierId}
      />
      <PickerSheet
        visible={showItems}
        onClose={() => setShowItems(false)}
        eyebrow="اختيار"
        title="الأصناف"
        loading={items.isLoading}
        items={(items.data ?? []).map((i) => ({ id: i.id, label: i.item_name }))}
        onSelect={addItem}
      />
    </Screen>
  );
}

function FieldButton({
  label, value, placeholder, onPress,
}: { label: string; value: string | null; placeholder: string; onPress: () => void }) {
  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <Tap style={fieldStyles.field} onPress={onPress}>
        <Text style={value ? fieldStyles.value : fieldStyles.placeholder}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-back" size={14} color={Palette.inkSoft} />
      </Tap>
    </View>
  );
}

function TextField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.field}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Palette.inkSoft}
          style={fieldStyles.input}
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

const dateStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: Radius.md, padding: 6,
    borderWidth: 1, borderColor: Palette.line,
  },
  btn: {
    width: 38, height: 38, borderRadius: Radius.sm,
    backgroundColor: 'rgba(31,51,38,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  todayTag: { fontSize: 10, color: Palette.green, fontFamily: Fonts.arabicBold },
});

const lineStyles = StyleSheet.create({
  empty: { textAlign: 'center', color: Palette.inkSoft, fontFamily: Fonts.arabic, padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: Radius.md, padding: 14, gap: 10, borderWidth: 1, borderColor: Palette.line },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 15, color: Palette.ink, fontFamily: Fonts.arabicBold, flex: 1 },
  pkgs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pkg: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.lineStrong },
  pkgSel: { backgroundColor: Palette.greenDk, borderColor: Palette.greenDk },
  pkgTxt: { fontSize: 11, color: Palette.ink, fontFamily: Fonts.arabicBold },
  pkgTxtSel: { color: '#fff' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Palette.line },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 30, height: 30, borderRadius: Radius.pill, backgroundColor: 'rgba(31,51,38,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnPlus: { backgroundColor: Palette.greenDk },
  qtyBtnTxt: { fontSize: 16, color: Palette.ink, fontFamily: Fonts.arabicBold, lineHeight: 18 },
  qtyBtnPlusTxt: { fontSize: 14, color: '#fff', fontFamily: Fonts.arabicBold, lineHeight: 16 },
  qtyInput: {
    minWidth: 48, textAlign: 'center', fontSize: 14,
    color: Palette.ink, fontFamily: Fonts.arabicBold, padding: 0,
  },
  priceBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(31,51,38,0.04)', borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  priceLabel: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  priceInput: {
    flex: 1, textAlign: 'left', fontSize: 13,
    color: Palette.ink, fontFamily: Fonts.arabicBold, padding: 0,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Palette.line,
  },
  totalLabel: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicMedium },
  totalValue: { fontSize: 13, color: Palette.ink, fontFamily: Fonts.arabicBold },
});

const styles = StyleSheet.create({
  body: { padding: 22, paddingBottom: 120, gap: 12 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Palette.greenDk, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill,
  },
  addTxt: { color: '#fff', fontSize: 11, fontFamily: Fonts.arabicBold },

  grandTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Palette.cardA, borderRadius: Radius.md, padding: 14, marginTop: 4,
  },
  grandTotalLabel: { fontSize: 13, color: Palette.greenDk, fontFamily: Fonts.arabicBold },
  grandTotalValue: { fontSize: 16, color: Palette.greenDk, fontFamily: Fonts.arabicBold },

  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 22,
    backgroundColor: Palette.bgBottom,
    borderTopWidth: 1, borderTopColor: Palette.line,
  },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: Radius.md,
  },
  btnPrimary: { backgroundColor: Palette.greenDk },
  btnPrimaryTxt: { color: '#fff', fontSize: 14, fontFamily: Fonts.arabicBold },
});
