import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_CONTENT_HEIGHT } from "@/hooks/useTabBarHeight";

import { Fonts, Palette, Radius, Space } from "@/constants/theme";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/auth";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return ({ color }: { color: string; focused: boolean }) => (
    <Ionicons name={name} size={20} color={color} />
  );
}

function tabLabel(text: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text
      style={{
        color: focused ? Palette.white : Palette.ink,
        fontFamily: focused ? Fonts.arabicBold : Fonts.arabicMedium,
        fontSize: 11,
        lineHeight: 14,
      }}
    >
      {text}
    </Text>
  );
}

export default function TabLayout() {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const { can } = usePermissions();
  const insets = useSafeAreaInsets();
  // Keep the bar above the home indicator / Android nav bar on every device;
  // fall back to 10 on devices with no bottom inset (button-nav Android, iPhone SE).
  const bottomPad = Math.max(insets.bottom, 10);

  if (!initialized) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.white,
        tabBarInactiveTintColor: Palette.ink,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: TAB_BAR_CONTENT_HEIGHT + bottomPad,
          borderTopLeftRadius: Radius.lg,
          borderTopRightRadius: Radius.lg,
          backgroundColor: Palette.white,
          // Flat: a hairline reads as the bar's edge instead of a cast shadow.
          borderTopWidth: 1,
          borderTopColor: Palette.line,
          paddingTop: Space.sm,
          paddingBottom: bottomPad,
          paddingHorizontal: Space.lg,
        },
        tabBarIconStyle: { marginBottom: -4 },
        tabBarItemStyle: {
          borderRadius: Radius.pill, marginHorizontal: 3, height: 52, overflow: 'hidden',
          paddingVertical: Space.xs,
        },
        tabBarActiveBackgroundColor: Palette.greenDk,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: tabIcon("home-outline"),
          tabBarLabel: tabLabel("الرئيسية"),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "الطلبات",
          tabBarIcon: tabIcon("basket-outline"),
          tabBarLabel: tabLabel("الطلبات"),
        }}
      />
      <Tabs.Screen
        name="purchase"
        options={{
          title: "المشتريات",
          tabBarIcon: tabIcon("cart-outline"),
          tabBarLabel: tabLabel("المشتريات"),
          href: can('read_purchases') ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "حسابي",
          tabBarIcon: tabIcon("person-outline"),
          tabBarLabel: tabLabel("حسابي"),
        }}
      />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
