import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Platform, Text } from "react-native";

import { Fonts, Palette } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={name} size={focused ? 18 : 22} color={color} />
  );
}

function tabLabel(text: string) {
  return ({ focused }: { focused: boolean }) =>
    focused ? (
      <Text
        style={{
          color: Palette.white,
          fontFamily: Fonts.arabicBold,
          fontSize: 13,
          marginRight: 6,
        }}
      >
        {text}
      </Text>
    ) : null;
}

export default function TabLayout() {
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.white,
        tabBarInactiveTintColor: Palette.ink,
        tabBarLabelPosition: "beside-icon",
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: Platform.OS === "ios" ? 78 : 64,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          backgroundColor: "rgba(255,255,255,0.98)",
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 18 : 8,
          paddingHorizontal: 16,
          shadowColor: "#1f3326",
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
        tabBarItemStyle: { borderRadius: 999, marginHorizontal: 3, height: 52, overflow: 'hidden' },
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
