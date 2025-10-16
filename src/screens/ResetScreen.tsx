import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Divider,
  Portal,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export const ResetScreen: React.FC = () => {
  const router = useRouter();
  // Temporary: Remove reset functionality for now since database doesn't support it
  const loading = false;

  const [selectedOptions, setSelectedOptions] = useState({
    transactions: false,
    loans: false,
    categories: false,
    balances: false,
  });
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [resetType, setResetType] = useState<"all" | "custom">("all");

  const handleSelectOption = (option: keyof typeof selectedOptions) => {
    setSelectedOptions({
      ...selectedOptions,
      [option]: !selectedOptions[option],
    });
  };

  const handleResetAll = () => {
    setResetType("all");
    setConfirmDialogVisible(true);
  };

  const handleCustomReset = () => {
    const hasSelection = Object.values(selectedOptions).some(
      (selected) => selected
    );
    if (!hasSelection) {
      Alert.alert("Peringatan", "Pilih minimal satu item untuk direset");
      return;
    }
    setResetType("custom");
    setConfirmDialogVisible(true);
  };

  const executeReset = async () => {
    try {
      setConfirmDialogVisible(false);

      // TODO: Implement reset functionality with new database structure
      Alert.alert(
        "Info",
        "Reset functionality not yet implemented with new database structure"
      );

      /*
      if (resetType === "all") {
        await resetAllData();
        Alert.alert("Berhasil", "Semua data telah direset");
      } else {
        // Custom reset
        if (selectedOptions.transactions) {
          await resetTransactions();
        }
        if (selectedOptions.loans) {
          await resetLoans();
        }
        if (selectedOptions.categories) {
          await resetCategories();
        }
        if (selectedOptions.balances) {
          await resetCategoryBalances();
        }
        Alert.alert("Berhasil", "Data yang dipilih telah direset");
      }
      */

      // Reset selection setelah berhasil
      setSelectedOptions({
        transactions: false,
        loans: false,
        categories: false,
        balances: false,
      });
    } catch (error) {
      console.error("Error resetting data:", error);
      Alert.alert("Error", "Terjadi kesalahan saat mereset data");
    }
  };

  const getResetDescription = () => {
    if (resetType === "all") {
      return "Semua data akan dihapus secara permanen:\n• Riwayat Transaksi\n• Data Pinjaman\n• Kategori\n• Saldo Kategori";
    }

    const selectedItems = [];
    if (selectedOptions.transactions) selectedItems.push("• Riwayat Transaksi");
    if (selectedOptions.loans) selectedItems.push("• Data Pinjaman");
    if (selectedOptions.categories) selectedItems.push("• Kategori");
    if (selectedOptions.balances) selectedItems.push("• Saldo Kategori");

    return `Data berikut akan dihapus secara permanen:\n${selectedItems.join(
      "\n"
    )}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Card */}
        <Card style={styles.warningCard} elevation={2}>
          <Card.Content>
            <View style={styles.warningHeader}>
              <MaterialIcons name="warning" size={24} color="#FF9800" />
              <Text style={styles.warningTitle}>Peringatan Penting</Text>
            </View>
            <Text style={styles.warningText}>
              Proses reset akan menghapus data secara permanen dan tidak dapat
              dikembalikan. Pastikan Anda sudah yakin sebelum melanjutkan.
            </Text>
          </Card.Content>
        </Card>

        {/* Reset All Card */}
        <Card style={styles.actionCard} elevation={2}>
          <Card.Content>
            <View style={styles.actionHeader}>
              <MaterialIcons name="refresh" size={24} color="#F44336" />
              <Text style={styles.actionTitle}>Reset Semua Data</Text>
            </View>
            <Text style={styles.actionDescription}>
              Menghapus semua riwayat transaksi, pinjaman, kategori, dan saldo.
              Aplikasi akan kembali ke kondisi awal.
            </Text>
            <Button
              mode="contained"
              onPress={handleResetAll}
              style={[styles.resetButton, styles.resetAllButton]}
              labelStyle={styles.resetButtonText}
              disabled={loading}
              icon="delete"
            >
              Reset Semua Data
            </Button>
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        {/* Custom Reset Card */}
        <Card style={styles.actionCard} elevation={2}>
          <Card.Content>
            <View style={styles.actionHeader}>
              <MaterialIcons name="tune" size={24} color="#2196F3" />
              <Text style={styles.actionTitle}>Reset Custom</Text>
            </View>
            <Text style={styles.actionDescription}>
              Pilih data spesifik yang ingin direset sesuai kebutuhan Anda.
            </Text>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <View style={styles.optionItem}>
                <Checkbox
                  status={
                    selectedOptions.transactions ? "checked" : "unchecked"
                  }
                  onPress={() => handleSelectOption("transactions")}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Riwayat Transaksi</Text>
                  <Text style={styles.optionSubtitle}>
                    Hapus semua transaksi pemasukan dan pengeluaran
                  </Text>
                </View>
              </View>

              <View style={styles.optionItem}>
                <Checkbox
                  status={selectedOptions.loans ? "checked" : "unchecked"}
                  onPress={() => handleSelectOption("loans")}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Data Pinjaman</Text>
                  <Text style={styles.optionSubtitle}>
                    Hapus semua data pinjaman (utang/piutang)
                  </Text>
                </View>
              </View>

              <View style={styles.optionItem}>
                <Checkbox
                  status={selectedOptions.categories ? "checked" : "unchecked"}
                  onPress={() => handleSelectOption("categories")}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Kategori</Text>
                  <Text style={styles.optionSubtitle}>
                    Hapus semua kategori keuangan
                  </Text>
                </View>
              </View>

              <View style={styles.optionItem}>
                <Checkbox
                  status={selectedOptions.balances ? "checked" : "unchecked"}
                  onPress={() => handleSelectOption("balances")}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Saldo Kategori</Text>
                  <Text style={styles.optionSubtitle}>
                    Reset saldo semua kategori ke nol
                  </Text>
                </View>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleCustomReset}
              style={[styles.resetButton, styles.customResetButton]}
              labelStyle={styles.resetButtonText}
              disabled={loading}
              icon="delete"
            >
              Reset Data Terpilih
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmDialogVisible}
          onDismiss={() => setConfirmDialogVisible(false)}
        >
          <Dialog.Title>Konfirmasi Reset</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>{getResetDescription()}</Text>
            <Text style={styles.dialogWarning}>
              Aksi ini tidak dapat dibatalkan. Lanjutkan?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialogVisible(false)}>
              Batal
            </Button>
            <Button
              onPress={executeReset}
              mode="contained"
              buttonColor="#F44336"
              textColor="#FFFFFF"
            >
              Ya, Reset
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 75,
  },
  warningCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFF3E0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E65100",
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: "#BF360C",
    lineHeight: 20,
  },
  actionCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginLeft: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  resetAllButton: {
    backgroundColor: "#F44336",
  },
  customResetButton: {
    backgroundColor: "#2196F3",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  divider: {
    marginVertical: 8,
    backgroundColor: "#E0E0E0",
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  optionContent: {
    flex: 1,
    marginLeft: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  dialogText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    marginBottom: 12,
  },
  dialogWarning: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "bold",
  },
});
