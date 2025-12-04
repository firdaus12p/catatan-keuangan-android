import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Divider,
  Portal,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { showError, showSuccess, showWarning } from "../utils/alertHelper";

export const ResetScreen: React.FC = () => {
  const router = useRouter();
  const {
    resetAllData,
    resetTransactions,
    resetLoans,
    resetCategories,
    resetCategoryBalances,
    clearTransactionHistory, // ✅ NEW: Clear history only, keep balances
    loading,
  } = useApp();

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
      showWarning("Pilih minimal satu item untuk direset");
      return;
    }
    setResetType("custom");
    setConfirmDialogVisible(true);
  };

  const executeReset = async () => {
    try {
      setConfirmDialogVisible(false);

      if (resetType === "all") {
        await resetAllData();
        showSuccess("Semua data telah direset", "Berhasil");
      } else {
        // Custom reset
        if (selectedOptions.transactions) {
          // ✅ NEW: Detect if ONLY transactions selected (other options false)
          const onlyTransactions =
            selectedOptions.transactions &&
            !selectedOptions.loans &&
            !selectedOptions.categories &&
            !selectedOptions.balances;

          if (onlyTransactions) {
            // Clear history only, preserve balances & aggregates
            const deletedCount = await clearTransactionHistory();
            showSuccess(
              `${deletedCount} riwayat transaksi telah dihapus. Saldo kategori tetap dipertahankan.`,
              "Berhasil"
            );
          } else {
            // Full reset: transactions + other data, reset balances to 0
            await resetTransactions();
            showSuccess("Data yang dipilih telah direset", "Berhasil");
          }
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

        // Show success for non-transaction resets
        if (
          !selectedOptions.transactions &&
          (selectedOptions.loans ||
            selectedOptions.categories ||
            selectedOptions.balances)
        ) {
          showSuccess("Data yang dipilih telah direset", "Berhasil");
        }
      }

      // Reset selection setelah berhasil
      setSelectedOptions({
        transactions: false,
        loans: false,
        categories: false,
        balances: false,
      });
    } catch (error) {
      showError("Terjadi kesalahan saat mereset data");
    }
  };

  const getResetDescription = () => {
    if (resetType === "all") {
      return "Semua data akan dihapus secara permanen:\n• Riwayat Transaksi\n• Data Pinjaman\n• Kategori\n• Saldo Kategori";
    }

    // ✅ NEW: Detect if ONLY transactions selected
    const onlyTransactions =
      selectedOptions.transactions &&
      !selectedOptions.loans &&
      !selectedOptions.categories &&
      !selectedOptions.balances;

    if (onlyTransactions) {
      // Special case: Clear history only, preserve balances
      return "Riwayat transaksi akan dihapus:\n• Riwayat Transaksi\n\n✅ Total Saldo, Pemasukan, Pengeluaran, Saldo Bersih, dan Saldo Kategori akan TETAP DIPERTAHANKAN";
    }

    // Standard case: Full reset with selected items
    const selectedItems = [];
    if (selectedOptions.transactions)
      selectedItems.push(
        "• Riwayat Transaksi (saldo kategori akan direset ke 0)"
      );
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
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelectOption("transactions")}
              >
                <Checkbox
                  status={
                    selectedOptions.transactions ? "checked" : "unchecked"
                  }
                  onPress={() => handleSelectOption("transactions")}
                />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Riwayat Transaksi</Text>
                  <Text style={styles.optionSubtitle}>
                    Hapus riwayat transaksi (saldo kategori tetap ada)
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelectOption("loans")}
              >
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
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelectOption("categories")}
              >
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
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelectOption("balances")}
              >
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
              </TouchableOpacity>
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
