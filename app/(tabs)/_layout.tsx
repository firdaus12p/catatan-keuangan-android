import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { FloatingActionButtons } from "../../src/components/FloatingActionButtons";

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "#999999",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#E0E0E0",
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
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Beranda",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transaction"
          options={{
            title: "Transaksi",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="receipt-long" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="category"
          options={{
            title: "Kategori",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="category" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="loan"
          options={{
            title: "Pinjaman",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="handshake" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <FloatingActionButtons />
    </>
  );
}
