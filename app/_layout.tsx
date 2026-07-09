import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_700Bold,
  useFonts,
} from "@expo-google-fonts/noto-sans-arabic";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { I18nManager } from "react-native";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";

import { SplashScreenView } from "@/components/SplashScreenView";

import { useColorScheme } from "@/components/useColorScheme";
import { useNewOrderWatcher } from "@/features/sales/useNewOrderWatcher";
import { makeQueryClient, queryPersister } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "login",
};

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_700Bold,
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (!splashDone) {
    return <SplashScreenView onFinished={() => setSplashDone(true)} />;
  }

  return <RootLayoutNav />;
}

function NewOrderWatcher() {
  useNewOrderWatcher();
  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(() => makeQueryClient());

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        // Persist for 24h; refetch will overwrite anything older.
        maxAge: 1000 * 60 * 60 * 24,
        buster: "v1",
      }}
    >
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <NewOrderWatcher />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="customers" />
          <Stack.Screen name="customers/new" />
          <Stack.Screen name="customers/[id]" />
          <Stack.Screen name="products" />
          <Stack.Screen name="stock" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
