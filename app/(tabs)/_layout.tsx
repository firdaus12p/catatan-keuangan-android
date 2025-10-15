import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Animated } from "react-native";
import { FloatingActionButtons } from "../../src/components/FloatingActionButtons";
import { colors } from "../../src/styles/commonStyles";

export default function TabLayout() {
  // Function untuk membuat icon dengan zoom effect dan warna spesifik saat aktif
  const createTabIcon =
    (iconName: keyof typeof MaterialIcons.glyphMap, tabColor: string) =>
    ({
      color,
      size,
      focused,
    }: {
      color: string;
      size: number;
      focused: boolean;
    }) => {
      // Gunakan warna spesifik tab dengan opacity yang lebih ringan saat tidak aktif
      const iconColor = focused ? tabColor : `${tabColor}80`; // 80 = 50% opacity dalam hex

      return (
        <Animated.View
          style={{
            transform: [{ scale: focused ? 1.15 : 1 }],
          }}
        >
          <MaterialIcons name={iconName} size={size} color={iconColor} />
        </Animated.View>
      );
    };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarInactiveTintColor: colors.textMuted,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 90,
            paddingBottom: 0,
            paddingTop: 8,
            paddingHorizontal: 10,
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginBottom: 4,
          },
          tabBarIconStyle: {
            marginTop: 2,
            marginBottom: 2, // Tambahan ruang untuk zoom effect
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Beranda",
            tabBarActiveTintColor: colors.home,
            tabBarIcon: createTabIcon("home", colors.home),
          }}
        />
        <Tabs.Screen
          name="transaction"
          options={{
            title: "Transaksi",
            tabBarActiveTintColor: colors.income,
            tabBarIcon: createTabIcon("receipt-long", colors.income),
          }}
        />
        <Tabs.Screen
          name="category"
          options={{
            title: "Kategori",
            tabBarActiveTintColor: colors.category,
            tabBarIcon: createTabIcon("category", colors.category),
          }}
        />
        <Tabs.Screen
          name="loan"
          options={{
            title: "Pinjaman",
            tabBarActiveTintColor: colors.loan,
            tabBarIcon: createTabIcon("handshake", colors.loan),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: "Notifikasi",
            tabBarActiveTintColor: colors.notification,
            tabBarIcon: createTabIcon("notifications", colors.notification),
          }}
        />
      </Tabs>
      <FloatingActionButtons />
    </>
  );
}
