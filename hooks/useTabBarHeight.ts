import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Must match the tabBarStyle height in app/(tabs)/_layout.tsx: the floating
// tab bar is 60pt of content plus the device's bottom safe-area inset
// (min 10 on devices without one). Screens that pin footers above the tab
// bar should offset by this value.
export const TAB_BAR_CONTENT_HEIGHT = 60;

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_CONTENT_HEIGHT + Math.max(insets.bottom, 10);
}
