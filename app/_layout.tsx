import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";

import { AppProvider, useAppContext } from "@/src/context/AppContext";
import { paperTheme } from "@/src/utils/theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // abaikan error ketika splash sudah ditutup
});

function SplashGate() {
  const { loading } = useAppContext();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  return null;
}

export default function RootLayout() {
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="dark" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <SplashGate />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-transaction" options={{ title: "Tambah Transaksi" }} />
          </Stack>
        </AppProvider>
      </GestureHandlerRootView>
    </PaperProvider>
  );
}
