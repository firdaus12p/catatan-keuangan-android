import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { FAB, Portal } from "react-native-paper";

export const FloatingActionButtons: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onStateChange = ({ open }: { open: boolean }) => setOpen(open);

  const handlePemasukanPress = () => {
    setOpen(false);
    // Navigate ke transaction tab dengan parameter untuk pemasukan
    router.push("/(tabs)/transaction?action=income");
  };

  const handlePengeluaranPress = () => {
    setOpen(false);
    // Navigate ke transaction tab dengan parameter untuk pengeluaran
    router.push("/(tabs)/transaction?action=expense");
  };

  const handlePinjamanPress = () => {
    setOpen(false);
    // Navigate ke loan tab dengan aksi tambah pinjaman
    router.push("/(tabs)/loan?action=add");
  };

  const handleKategoriPress = () => {
    setOpen(false);
    // Navigate ke category tab dengan aksi tambah kategori
    router.push("/(tabs)/category?action=add");
  };

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible={true}
        icon={open ? "close" : "plus"}
        actions={[
          {
            icon: () => (
              <MaterialIcons name="trending-up" size={20} color="#FFFFFF" />
            ),
            label: "Pemasukan",
            onPress: handlePemasukanPress,
            style: { backgroundColor: "#4CAF50" },
            labelTextColor: "#4CAF50",
          },
          {
            icon: () => (
              <MaterialIcons name="trending-down" size={20} color="#FFFFFF" />
            ),
            label: "Pengeluaran",
            onPress: handlePengeluaranPress,
            style: { backgroundColor: "#F44336" },
            labelTextColor: "#F44336",
          },
          {
            icon: () => (
              <MaterialIcons name="handshake" size={20} color="#FFFFFF" />
            ),
            label: "Tambah Pinjaman",
            onPress: handlePinjamanPress,
            style: { backgroundColor: "#FF9800" },
            labelTextColor: "#FF9800",
          },
          {
            icon: () => (
              <MaterialIcons name="category" size={20} color="#FFFFFF" />
            ),
            label: "Tambah Kategori",
            onPress: handleKategoriPress,
            style: { backgroundColor: "#9C27B0" },
            labelTextColor: "#9C27B0",
          },
        ]}
        onStateChange={onStateChange}
        onPress={() => {
          if (open) {
            // do something if the speed dial is open
          }
        }}
        fabStyle={styles.fab}
        style={styles.fabGroup}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  fabGroup: {
    paddingBottom: 80, // Memberikan ruang agar tidak menutupi tab navigation
  },
  fab: {
    backgroundColor: "#2196F3",
  },
});
