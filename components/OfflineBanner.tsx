import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Palette } from '@/constants/theme';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      const isOff = !(s.isConnected && (s.isInternetReachable ?? true));
      setOffline(isOff);
    });
    return unsub;
  }, []);

  if (!offline) return null;
  return (
    <View style={styles.bar}>
      <Text style={styles.txt}>وضع عدم الاتصال — البيانات قد تكون قديمة</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Palette.danger, paddingVertical: 6, paddingHorizontal: 14, alignItems: 'center' },
  txt: { color: '#fff', fontSize: 12, fontFamily: Fonts.arabicBold },
});
