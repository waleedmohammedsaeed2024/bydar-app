import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bgTop },
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    backgroundColor: Palette.bgTop,
  },
  bgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
    backgroundColor: Palette.bgBottom,
  },
  safe: { flex: 1 },
});
