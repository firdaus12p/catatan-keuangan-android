import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Divider,
  Modal,
  Portal,
  RadioButton,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionItem } from "../components/TransactionItem";
import { useApp } from "../context/AppContext";
import { Transaction } from "../db/database";
import {
  getCurrentMonthYear,
  getMonthName,
  getTodayString,
} from "../utils/dateHelper";
import {
  formatCurrency,
  formatNumberInput,
  parseNumberInput,
} from "../utils/formatCurrency";

export const AddTransactionScreen: React.FC = () => {
  const {
    categories,
    transactions,
    loadCategories,
    loadTransactions,
    addTransaction,
    addGlobalIncome,
  } = useApp();

  const { action } = useLocalSearchParams<{ action?: string }>();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income"
  );
  const [isGlobalIncome, setIsGlobalIncome] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    categoryId: "",
    note: "",
  });
  const [filter, setFilter] = useState<"all" | "current" | "previous">(
    "current"
  );

  // Handle floating action button actions
  useEffect(() => {
    if (action === "income") {
      openModal("income");
      // Clear parameter setelah digunakan
      router.replace("/(tabs)/transaction");
    } else if (action === "expense") {
      openModal("expense");
      // Clear parameter setelah digunakan
      router.replace("/(tabs)/transaction");
    }
  }, [action]);

  // Refresh data saat screen difokuskan
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
      loadTransactions();
    }, [])
  );

  const resetForm = () => {
    setFormData({
      amount: "",
      categoryId: "",
      note: "",
    });
    setIsGlobalIncome(false);
    setTransactionType("income");
  };

  const openModal = (type: "income" | "expense") => {
    resetForm();
    setTransactionType(type);
    if (type === "income") {
      setIsGlobalIncome(true); // Default ke global income
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    const amount = parseNumberInput(formData.amount);

    if (amount <= 0) {
      Alert.alert("Error", "Jumlah harus lebih dari 0");
      return false;
    }

    if (!isGlobalIncome && !formData.categoryId) {
      Alert.alert("Error", "Pilih kategori terlebih dahulu");
      return false;
    }

    // Validasi saldo untuk pengeluaran
    if (transactionType === "expense") {
      const selectedCategory = categories.find(
        (cat) => cat.id!.toString() === formData.categoryId
      );
      if (selectedCategory && selectedCategory.balance < amount) {
        Alert.alert(
          "Error",
          `Saldo kategori "${
            selectedCategory.name
          }" tidak mencukupi.\nSaldo: ${formatCurrency(
            selectedCategory.balance
          )}`
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const amount = parseNumberInput(formData.amount);

      if (transactionType === "income" && isGlobalIncome) {
        // Pemasukan global - dibagi otomatis ke semua kategori
        await addGlobalIncome(amount, formData.note || "Pemasukan Global");
      } else {
        // Transaksi biasa
        const transactionData = {
          type: transactionType,
          amount,
          category_id: parseInt(formData.categoryId),
          note:
            formData.note ||
            (transactionType === "income" ? "Pemasukan" : "Pengeluaran"),
          date: getTodayString(),
        };

        await addTransaction(transactionData);
      }

      closeModal();
      Alert.alert("Sukses", "Transaksi berhasil ditambahkan");
    } catch (error) {
      Alert.alert("Error", "Gagal menambahkan transaksi");
      console.error("Error saving transaction:", error);
    }
  };

  // Filter transaksi berdasarkan bulan
  const getFilteredTransactions = (): Transaction[] => {
    if (filter === "all") return transactions;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth() + 1;

      if (filter === "current") {
        return (
          transactionYear === currentYear && transactionMonth === currentMonth
        );
      } else if (filter === "previous") {
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return transactionYear === prevYear && transactionMonth === prevMonth;
      }

      return false;
    });
  };

  // Statistik transaksi yang difilter
  const filteredTransactions = getFilteredTransactions();
  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const { month, year } = getCurrentMonthYear();
  const currentMonthName = getMonthName(month);
  const previousMonthName = getMonthName(month === 1 ? 12 : month - 1);

  const renderHeader = () => (
    <View>
      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Chip
          selected={filter === "current"}
          onPress={() => setFilter("current")}
          style={styles.filterChip}
        >
          {currentMonthName} {year}
        </Chip>
        <Chip
          selected={filter === "previous"}
          onPress={() => setFilter("previous")}
          style={styles.filterChip}
        >
          {previousMonthName}
        </Chip>
        <Chip
          selected={filter === "all"}
          onPress={() => setFilter("all")}
          style={styles.filterChip}
        >
          Semua
        </Chip>
      </View>

      {/* Statistik */}
      <Card style={styles.statsCard} elevation={2}>
        <Card.Content>
          <Text style={styles.statsTitle}>Ringkasan Transaksi</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.statLabel}>Pemasukan</Text>
              <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <Divider style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="trending-down" size={20} color="#F44336" />
              <Text style={styles.statLabel}>Pengeluaran</Text>
              <Text style={[styles.statValue, { color: "#F44336" }]}>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.netIncomeContainer}>
            <Text style={styles.netIncomeLabel}>Saldo Bersih:</Text>
            <Text
              style={[
                styles.netIncomeValue,
                {
                  color:
                    totalIncome - totalExpense >= 0 ? "#4CAF50" : "#F44336",
                },
              ]}
            >
              {formatCurrency(totalIncome - totalExpense)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} categories={categories} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Transaksi" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id!.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        }
      />

      {/* Modal untuk add transaksi */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              Tambah{" "}
              {transactionType === "income" ? "Pemasukan" : "Pengeluaran"}
            </Text>

            {/* Toggle Global Income untuk pemasukan */}
            {transactionType === "income" && (
              <Card style={styles.globalIncomeCard} elevation={1}>
                <Card.Content>
                  <View style={styles.globalIncomeHeader}>
                    <MaterialIcons
                      name="account-balance"
                      size={24}
                      color="#2196F3"
                    />
                    <Text style={styles.globalIncomeTitle}>
                      Pemasukan Global
                    </Text>
                  </View>
                  <Text style={styles.globalIncomeDescription}>
                    Pemasukan akan dibagi otomatis ke semua kategori berdasarkan
                    persentase alokasi
                  </Text>
                  <SegmentedButtons
                    value={isGlobalIncome ? "global" : "specific"}
                    onValueChange={(value) =>
                      setIsGlobalIncome(value === "global")
                    }
                    buttons={[
                      { value: "global", label: "Global" },
                      { value: "specific", label: "Spesifik" },
                    ]}
                    style={styles.segmentedButtons}
                  />
                </Card.Content>
              </Card>
            )}

            <TextInput
              label="Jumlah"
              value={formData.amount}
              onChangeText={(text) => {
                const formatted = formatNumberInput(text);
                setFormData({ ...formData, amount: formatted });
              }}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Contoh: 150.000"
              left={<TextInput.Affix text="Rp " />}
            />

            {/* Pilihan kategori - hanya jika bukan global income */}
            {!(transactionType === "income" && isGlobalIncome) && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryLabel}>Pilih Kategori:</Text>
                <RadioButton.Group
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                  value={formData.categoryId}
                >
                  {categories.map((category) => (
                    <View key={category.id} style={styles.categoryItem}>
                      <RadioButton value={category.id!.toString()} />
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryBalance}>
                          Saldo: {formatCurrency(category.balance)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </RadioButton.Group>
              </View>
            )}

            <TextInput
              label="Catatan (Opsional)"
              value={formData.note}
              onChangeText={(text) => setFormData({ ...formData, note: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Contoh: Gaji bulan ini, Beli groceries"
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={closeModal}
                style={styles.button}
              >
                Batal
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
              >
                Simpan
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#2196F3",
    elevation: 4,
    height: 20,
    minHeight: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: -25,
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 75,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 238,
    gap: 8,
    justifyContent: "flex-start",
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
  },
  statsCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  netIncomeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netIncomeLabel: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  netIncomeValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    margin: 20,
    borderRadius: 12,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 20,
    textAlign: "center",
  },
  globalIncomeCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  globalIncomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  globalIncomeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginLeft: 8,
  },
  globalIncomeDescription: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
    lineHeight: 20,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  categoryInfo: {
    marginLeft: 8,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: "#333333",
  },
  categoryBalance: {
    fontSize: 14,
    color: "#666666",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});
