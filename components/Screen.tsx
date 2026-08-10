import { ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';

const BANDS = 24;

const hex = (c: string) => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];

/**
 * Flat backdrop with a soft top→bottom wash. Built from stacked bands rather
 * than a gradient library — at 24 steps across a phone screen the seams are
 * below the perceptual threshold, and it keeps the app dependency-free.
 */
function useWash() {
  return useMemo(() => {
    const [r1, g1, b1] = hex(Palette.bgTop);
    const [r2, g2, b2] = hex(Palette.bgBottom);
    return Array.from({ length: BANDS }, (_, i) => {
      const t = i / (BANDS - 1);
      const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
      return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
    });
  }, []);
}

export function Screen({ children }: { children: ReactNode }) {
  const wash = useWash();

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {wash.map((color, i) => (
          <View key={i} style={[styles.band, { backgroundColor: color }]} />
        ))}
      </View>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bgTop },
  band: { flex: 1 },
  safe: { flex: 1 },
});
