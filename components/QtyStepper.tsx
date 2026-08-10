import { StyleSheet, Switch, Text, TextStyle, View } from 'react-native';

import { Fonts, Palette, Radius } from '@/constants/theme';
import { QtyStep, splitQty, stepQty } from '@/lib/utils';
import { Tap } from '@/components/Tap';

/** Renders a quantity with the integer part bold and the fraction light. */
export function QtyText({ value, style }: { value: number; style?: TextStyle | TextStyle[] }) {
  const { int, frac } = splitQty(value);
  return (
    <Text style={style}>
      {int}
      {frac ? <Text style={styles.frac}>{frac}</Text> : null}
    </Text>
  );
}

/**
 * −/+ stepper with a whole/half switch. Lines start on whole numbers; flipping
 * the switch makes each press move the quantity by 0.5 instead of 1.
 */
export function QtyStepper({
  value, step, onChange, onStepChange,
}: {
  value: number;
  step: QtyStep;
  onChange: (next: number) => void;
  onStepChange: (next: QtyStep) => void;
}) {
  return (
    <View style={styles.row}>
      <Tap style={styles.btn} onPress={() => onChange(stepQty(value, step, -1))}>
        <Text style={styles.btnTxt}>−</Text>
      </Tap>
      <QtyText value={value} style={styles.value} />
      <Tap
        style={[styles.btn, styles.btnPlus]}
        onPress={() => onChange(stepQty(value, step, 1))}>
        <Text style={styles.btnPlusTxt}>＋</Text>
      </Tap>

      <View style={styles.toggle}>
        <Text style={styles.toggleTxt}>0.5</Text>
        <Switch
          value={step === 0.5}
          onValueChange={(on) => onStepChange(on ? 0.5 : 1)}
          trackColor={{ false: 'rgba(31,51,38,0.15)', true: Palette.green }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 32, height: 32, borderRadius: Radius.pill, backgroundColor: 'rgba(31,51,38,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnPlus: { backgroundColor: Palette.greenDk },
  btnTxt: { fontSize: 18, color: Palette.ink, fontFamily: Fonts.arabicBold, lineHeight: 20 },
  btnPlusTxt: { fontSize: 16, color: '#fff', fontFamily: Fonts.arabicBold, lineHeight: 18 },
  value: { minWidth: 44, textAlign: 'center', fontSize: 14, color: Palette.ink, fontFamily: Fonts.arabicBold },
  frac: { fontFamily: Fonts.arabic, color: Palette.inkSoft },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginStart: 'auto' },
  toggleTxt: { fontSize: 11, color: Palette.inkSoft, fontFamily: Fonts.arabicBold },
});
