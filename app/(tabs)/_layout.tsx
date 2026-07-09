import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_CONTENT_HEIGHT } from "@/hooks/useTabBarHeight";

import { Fonts, Palette } from "@/constants/theme";
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
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          backgroundColor: "rgba(255,255,255,0.98)",
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: bottomPad,
          paddingHorizontal: 16,
          shadowColor: "#1f3326",
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        tabBarIconStyle: { marginBottom: -4 },
        tabBarItemStyle: {
          borderRadius: 999, marginHorizontal: 3, height: 52, overflow: 'hidden',
          paddingVertical: 4,
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
