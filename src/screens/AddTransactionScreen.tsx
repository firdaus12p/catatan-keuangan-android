import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Appbar,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  Modal,
  Portal,
  RadioButton,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExpenseTypeManagerModal } from "../components/ExpenseTypeManagerModal";
import { TransactionItem } from "../components/TransactionItem";
import { useApp } from "../context/AppContext";
import { Transaction } from "../db/database";
import { colors } from "../styles/commonStyles";
import { showConfirm, showError, showSuccess } from "../utils/alertHelper";
import {
  getAllocationDeficit,
  isAllocationComplete,
} from "../utils/allocation";
import { FLATLIST_CONFIG } from "../utils/constants";
import {
  formatDate,
  getCurrentMonthYear,
  getMonthName,
  getTodayString,
} from "../utils/dateHelper";
import {
  formatCurrency,
  formatNumberInput,
  parseNumberInput,
} from "../utils/formatCurrency";
import {
  validatePositiveAmount,
  validateSelection,
  validateSufficientBalance,
} from "../utils/validationHelper";

export const AddTransactionScreen: React.FC = () => {
  const {
    categories,
    transactions,
    expenseTypes,
    loadCategories,
    loadTransactions,
    loadExpenseTypes,
    loadAllData,
    addTransaction,
    addGlobalIncome,
    addMultiCategoryIncome,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
  } = useApp();

  const { action } = useLocalSearchParams<{ action?: string }>();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "income"
  );
  const [isGlobalIncome, setIsGlobalIncome] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    categoryId: "",
    note: "",
    expenseTypeId: "",
  });
  const [filter, setFilter] = useState<"all" | "current" | "previous">(
    "current"
  );
  const [expenseTypeManagerVisible, setExpenseTypeManagerVisible] =
    useState(false);
  const [saving, setSaving] = useState(false);

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
      loadAllData(); // ✅ OPTIMIZED: Load all data in parallel
    }, [loadAllData])
  );

  // Set default expense type saat tersedia
  useEffect(() => {
    if (
      transactionType === "expense" &&
      !formData.expenseTypeId &&
      expenseTypes.length > 0
    ) {
      const firstType = expenseTypes[0];
      if (firstType?.id) {
        setFormData((prev) => ({
          ...prev,
          expenseTypeId: firstType.id!.toString(),
        }));
      }
    }
  }, [expenseTypes, transactionType, formData.expenseTypeId]);

  useEffect(() => {
    if (transactionType === "income" && formData.expenseTypeId) {
      setFormData((prev) => ({
        ...prev,
        expenseTypeId: "",
      }));
    }
  }, [transactionType, formData.expenseTypeId]);

  // Hitung total persentase alokasi dari semua kategori
  const hasCategories = categories.length > 0;
  const totalAllocationPercentage = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.percentage, 0);
  }, [categories]);

  // Validasi total alokasi sebelum membuka modal
  const validateAllocation = useCallback(() => {
    if (!hasCategories) {
      return true;
    }

    if (!isAllocationComplete(totalAllocationPercentage)) {
      const deficit = getAllocationDeficit(totalAllocationPercentage);
      showConfirm(
        "Alokasi Belum Lengkap",
        `Total alokasi kategori saat ini ${totalAllocationPercentage.toFixed(
          1
        )}%.\n\nTambahkan alokasi sebesar ${deficit.toFixed(
          1
        )}% lagi agar mencapai 100% sebelum dapat menginput transaksi.\n\nSilakan pergi ke halaman Kategori untuk menambah kategori atau mengatur ulang persentase alokasi.`,
        () => router.push("/(tabs)/category"),
        undefined,
        "Ke Halaman Kategori",
        "OK"
      );
      return false;
    }
    return true;
  }, [hasCategories, router, totalAllocationPercentage]);

  const resetForm = useCallback(() => {
    setFormData({
      amount: "",
      categoryId: "",
      note: "",
      expenseTypeId: "",
    });
    setIsGlobalIncome(false);
    setSelectedCategoryIds([]);
    setTransactionType("income");
  }, []);

  const openModal = useCallback(
    (type: "income" | "expense") => {
      // Validasi alokasi sebelum membuka modal
      if (!validateAllocation()) {
        return;
      }

      resetForm();
      setTransactionType(type);
      if (type === "income") {
        setIsGlobalIncome(true); // Default ke global income
      }
      setModalVisible(true);
    },
    [resetForm]
  );

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  const validateForm = useCallback((): boolean => {
    const amount = parseNumberInput(formData.amount);

    if (!validatePositiveAmount(amount)) {
      return false;
    }

    // Validasi untuk pemasukan
    if (transactionType === "income" && !isGlobalIncome) {
      // Multi-category selection validation
      if (selectedCategoryIds.length === 0) {
        showError("Pilih minimal satu kategori untuk pemasukan spesifik");
        return false;
      }

      // Peringatan jika memilih semua kategori (sama dengan global)
      if (selectedCategoryIds.length === categories.length) {
        showConfirm(
          "Peringatan",
          "Anda telah memilih semua kategori. Ini sama dengan menggunakan mode 'Pemasukan Global'. Apakah Anda ingin melanjutkan atau menggunakan mode Global?",
          () => {
            // User pilih lanjut dengan multi-category
            return true;
          },
          () => {
            // User pilih ganti ke global
            setIsGlobalIncome(true);
            setSelectedCategoryIds([]);
            return false;
          },
          "Lanjutkan Multi Kategori",
          "Gunakan Mode Global"
        );
        return false;
      }
    }

    // Validasi untuk pengeluaran
    if (transactionType === "expense") {
      if (!validateSelection(formData.categoryId, "kategori")) {
        return false;
      }

      if (!validateSelection(formData.expenseTypeId, "jenis pengeluaran")) {
        return false;
      }

      const selectedCategory = categories.find(
        (cat) => cat.id!.toString() === formData.categoryId
      );
      if (selectedCategory) {
        if (
          !validateSufficientBalance(
            selectedCategory.balance,
            amount,
            `kategori "${selectedCategory.name}"`
          )
        ) {
          return false;
        }
      }
    }

    return true;
  }, [
    formData.amount,
    isGlobalIncome,
    formData.categoryId,
    formData.expenseTypeId,
    transactionType,
    categories,
    selectedCategoryIds,
  ]);

  const openExpenseTypeManager = useCallback(() => {
    setExpenseTypeManagerVisible(true);
  }, []);

  const closeExpenseTypeManager = useCallback(() => {
    setExpenseTypeManagerVisible(false);
  }, []);

  const handleCreateExpenseType = useCallback(
    async (name: string) => {
      const insertedId = await addExpenseType(name);
      setFormData((prev) => ({
        ...prev,
        expenseTypeId: insertedId.toString(),
      }));
    },
    [addExpenseType]
  );

  const handleUpdateExpenseType = useCallback(
    async (id: number, name: string) => {
      await updateExpenseType(id, name);
    },
    [updateExpenseType]
  );

  const handleDeleteExpenseType = useCallback(
    async (id: number) => {
      await deleteExpenseType(id);
      setFormData((prev) => ({
        ...prev,
        expenseTypeId:
          prev.expenseTypeId === id.toString() ? "" : prev.expenseTypeId,
      }));
    },
    [deleteExpenseType]
  );

  const handleSave = useCallback(async () => {
    if (saving) {
      return;
    }
    if (!validateForm()) return;

    // Validasi alokasi sebelum menyimpan transaksi
    if (!validateAllocation()) {
      return;
    }

    setSaving(true);
    try {
      const amount = parseNumberInput(formData.amount);

      if (transactionType === "income") {
        if (isGlobalIncome) {
          // Pemasukan global - dibagi otomatis ke semua kategori
          await addGlobalIncome(amount, formData.note || "Pemasukan Global");
        } else {
          // Pemasukan spesifik multi-kategori
          await addMultiCategoryIncome(
            amount,
            selectedCategoryIds,
            formData.note || "Pemasukan Multi Kategori"
          );
        }
      } else {
        // Pengeluaran - single category
        const transactionData = {
          type: "expense" as const,
          amount,
          category_id: parseInt(formData.categoryId),
          note: formData.note || "Pengeluaran",
          date: getTodayString(),
          expense_type_id: formData.expenseTypeId
            ? parseInt(formData.expenseTypeId, 10)
            : null,
        };

        await addTransaction(transactionData);
      }

      closeModal();
      showSuccess("Transaksi berhasil ditambahkan");
    } catch (error) {
      showError("Gagal menambahkan transaksi");
      console.error("Error saving transaction:", error);
    } finally {
      setSaving(false);
    }
  }, [
    saving,
    validateForm,
    validateAllocation,
    formData,
    transactionType,
    isGlobalIncome,
    selectedCategoryIds,
    addGlobalIncome,
    addMultiCategoryIncome,
    addTransaction,
    closeModal,
  ]);

  // Filter transaksi berdasarkan bulan dengan memoization
  const filteredTransactions = useMemo((): Transaction[] => {
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
  }, [transactions, filter]);

  // Group transaksi berdasarkan tanggal dengan memoization
  const groupedTransactions = useMemo(() => {
    const grouped = filteredTransactions.reduce((acc, transaction) => {
      const dateKey = formatDate(transaction.date);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    // Urutkan berdasarkan tanggal terbaru
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a][0].date);
      const dateB = new Date(grouped[b][0].date);
      return dateB.getTime() - dateA.getTime();
    });

    return sortedKeys.map((dateKey) => ({
      date: dateKey,
      transactions: grouped[dateKey].sort((a, b) => {
        // Urutkan transaksi dalam hari yang sama berdasarkan waktu
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }),
    }));
  }, [filteredTransactions]);

  // Statistik transaksi dengan memoization
  const { totalIncome, totalExpense } = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome: income, totalExpense: expense };
  }, [filteredTransactions]);

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

      {/* Header Riwayat Transaksi */}
      <View style={styles.historyHeader}>
        <View style={styles.historyTitleContainer}>
          <MaterialIcons name="history" size={24} color="#2196F3" />
          <Text style={styles.historyTitle}>Riwayat Transaksi</Text>
        </View>
        <Text style={styles.historySubtitle}>
          {filter === "current" && `${currentMonthName} ${year}`}
          {filter === "previous" &&
            `${previousMonthName} ${month === 1 ? year - 1 : year}`}
          {filter === "all" && "Semua Periode"}
        </Text>
        {filteredTransactions.length > 0 && (
          <Text style={styles.transactionCount}>
            {filteredTransactions.length} transaksi ditemukan
          </Text>
        )}
      </View>
    </View>
  );

  const renderTransactionGroup = ({
    item,
  }: {
    item: { date: string; transactions: Transaction[] };
  }) => (
    <View style={styles.transactionGroup}>
      <View style={styles.dateHeader}>
        <MaterialIcons name="calendar-today" size={16} color="#2196F3" />
        <Text style={styles.dateHeaderText}>{item.date}</Text>
        <Text style={styles.transactionCountInGroup}>
          {item.transactions.length} transaksi
        </Text>
      </View>
      {item.transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id!.toString()}
          transaction={transaction}
          categories={categories}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="💰 Transaksi" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <FlatList
        data={groupedTransactions}
        renderItem={renderTransactionGroup}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        // ✅ OPTIMIZED: FlatList performance props
        maxToRenderPerBatch={FLATLIST_CONFIG.DEFAULT.MAX_TO_RENDER_PER_BATCH}
        windowSize={FLATLIST_CONFIG.DEFAULT.WINDOW_SIZE}
        removeClippedSubviews={true}
        initialNumToRender={FLATLIST_CONFIG.DEFAULT.INITIAL_NUM_TO_RENDER}
        updateCellsBatchingPeriod={
          FLATLIST_CONFIG.DEFAULT.UPDATE_CELLS_BATCHING_PERIOD
        }
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
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
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
                <Text style={styles.categoryLabel}>
                  {transactionType === "income" && !isGlobalIncome
                    ? "Pilih Kategori (bisa pilih lebih dari 1):"
                    : "Pilih Kategori:"}
                </Text>

                {/* Multi-selection untuk pemasukan spesifik */}
                {transactionType === "income" && !isGlobalIncome ? (
                  <View style={styles.multiSelectContainer}>
                    {categories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(
                        category.id!
                      );
                      return (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryItem,
                            isSelected && styles.selectedCategoryItem,
                          ]}
                          onPress={() => {
                            const categoryId = category.id!;
                            if (isSelected) {
                              // Remove from selection
                              setSelectedCategoryIds((prev) =>
                                prev.filter((id) => id !== categoryId)
                              );
                            } else {
                              // Add to selection
                              setSelectedCategoryIds((prev) => [
                                ...prev,
                                categoryId,
                              ]);
                            }
                          }}
                        >
                          <Checkbox
                            status={isSelected ? "checked" : "unchecked"}
                            onPress={() => {
                              const categoryId = category.id!;
                              if (isSelected) {
                                setSelectedCategoryIds((prev) =>
                                  prev.filter((id) => id !== categoryId)
                                );
                              } else {
                                setSelectedCategoryIds((prev) => [
                                  ...prev,
                                  categoryId,
                                ]);
                              }
                            }}
                          />
                          <View style={styles.categoryInfo}>
                            <Text
                              style={[
                                styles.categoryName,
                                isSelected && styles.selectedCategoryName,
                              ]}
                            >
                              {category.name}
                            </Text>
                            <Text style={styles.categoryBalance}>
                              Saldo: {formatCurrency(category.balance)}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    {selectedCategoryIds.length > 0 && (
                      <View style={styles.selectionSummary}>
                        <Text style={styles.selectionText}>
                          {selectedCategoryIds.length} kategori dipilih
                        </Text>
                        <TouchableOpacity
                          onPress={() => setSelectedCategoryIds([])}
                          style={styles.clearSelectionButton}
                        >
                          <Text style={styles.clearSelectionText}>
                            Bersihkan
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  /* Single selection untuk expense */
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
                          <Text style={styles.categoryName}>
                            {category.name}
                          </Text>
                          <Text style={styles.categoryBalance}>
                            Saldo: {formatCurrency(category.balance)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </RadioButton.Group>
                )}
              </View>
            )}

            {transactionType === "expense" && !isGlobalIncome && (
              <View style={styles.expenseTypeSection}>
                <View style={styles.expenseTypeHeader}>
                  <Text style={styles.expenseTypeLabel}>
                    Jenis Pengeluaran:
                  </Text>
                  <TouchableOpacity
                    onPress={openExpenseTypeManager}
                    style={styles.expenseTypeManageButton}
                  >
                    <MaterialIcons
                      name="settings"
                      size={18}
                      color={colors.expense}
                    />
                    <Text style={styles.expenseTypeManageText}>Kelola</Text>
                  </TouchableOpacity>
                </View>
                {expenseTypes.length > 0 ? (
                  <RadioButton.Group
                    onValueChange={(value) =>
                      setFormData({ ...formData, expenseTypeId: value })
                    }
                    value={formData.expenseTypeId}
                  >
                    {expenseTypes.map((type) => (
                      <View key={type.id} style={styles.expenseTypeItem}>
                        <RadioButton value={type.id!.toString()} />
                        <View style={styles.expenseTypeInfo}>
                          <Text style={styles.expenseTypeName}>
                            {type.name}
                          </Text>
                          <Text style={styles.expenseTypeSpent}>
                            Total: {formatCurrency(type.total_spent)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </RadioButton.Group>
                ) : (
                  <View style={styles.emptyExpenseType}>
                    <Text style={styles.emptyExpenseTypeText}>
                      Belum ada jenis pengeluaran
                    </Text>
                    <Button
                      mode="outlined"
                      icon="plus"
                      onPress={openExpenseTypeManager}
                      compact
                    >
                      Tambah Jenis
                    </Button>
                  </View>
                )}
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
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
                loading={saving}
                disabled={saving}
              >
                Simpan
              </Button>
            </View>
          </KeyboardAwareScrollView>
        </Modal>
      </Portal>

      <ExpenseTypeManagerModal
        visible={expenseTypeManagerVisible}
        onDismiss={closeExpenseTypeManager}
        expenseTypes={expenseTypes}
        onCreate={handleCreateExpenseType}
        onUpdate={handleUpdateExpenseType}
        onDelete={handleDeleteExpenseType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: colors.income,
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
    color: colors.income,
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
    color: colors.income,
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
    color: colors.income,
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
  expenseTypeSection: {
    marginBottom: 16,
  },
  expenseTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  expenseTypeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  expenseTypeManageButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseTypeManageText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.expense,
    fontWeight: "600",
  },
  expenseTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  expenseTypeInfo: {
    marginLeft: 8,
    flex: 1,
  },
  expenseTypeName: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "500",
  },
  expenseTypeSpent: {
    fontSize: 13,
    color: "#777777",
  },
  emptyExpenseType: {
    paddingVertical: 8,
  },
  emptyExpenseTypeText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
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
  historyHeader: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.income,
    marginLeft: 8,
  },
  historySubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  transactionCount: {
    fontSize: 12,
    color: "#999999",
    fontStyle: "italic",
  },
  transactionGroup: {
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
    flex: 1,
  },
  transactionCountInGroup: {
    fontSize: 12,
    color: "#666666",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  multiSelectContainer: {
    gap: 8,
  },
  selectedCategoryItem: {
    backgroundColor: "#E3F2FD",
    borderColor: colors.income,
    borderWidth: 1,
  },
  selectedCategoryName: {
    color: colors.income,
    fontWeight: "600",
  },
  selectionSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#B3D9FF",
  },
  selectionText: {
    fontSize: 14,
    color: colors.income,
    fontWeight: "500",
  },
  clearSelectionButton: {
    backgroundColor: colors.expense,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearSelectionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
});
