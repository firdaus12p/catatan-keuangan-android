import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { colors } from "../styles/commonStyles";

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
              <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
            ),
            label: "Pemasukan",
            onPress: handlePemasukanPress,
            style: { backgroundColor: colors.income }, // Green - matching transaction tab
            labelTextColor: colors.income,
            size: "medium",
          },
          {
            icon: () => (
              <MaterialIcons name="trending-down" size={24} color="#FFFFFF" />
            ),
            label: "Pengeluaran",
            onPress: handlePengeluaranPress,
            style: { backgroundColor: colors.expense }, // Red - expense color
            labelTextColor: colors.expense,
            size: "medium",
          },
          {
            icon: () => (
              <MaterialIcons name="handshake" size={24} color="#FFFFFF" />
            ),
            label: "Tambah Pinjaman",
            onPress: handlePinjamanPress,
            style: { backgroundColor: colors.loan }, // Orange - matching loan tab
            labelTextColor: colors.loan,
            size: "medium",
          },
          {
            icon: () => (
              <MaterialIcons name="category" size={24} color="#FFFFFF" />
            ),
            label: "Tambah Kategori",
            onPress: handleKategoriPress,
            style: { backgroundColor: colors.category }, // Purple - matching category tab
            labelTextColor: colors.category,
            size: "medium",
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
        theme={{
          colors: {
            backdrop: "rgba(0, 0, 0, 0.5)",
          },
        }}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  fabGroup: {
    paddingBottom: 95, // Memberikan ruang agar tidak menutupi tab navigation
  },
  fab: {
    backgroundColor: colors.primary,
    elevation: 8, // Add more elevation for better visual
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
