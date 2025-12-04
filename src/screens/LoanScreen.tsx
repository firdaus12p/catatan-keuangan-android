import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal as RNModal,
  ScrollView,
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
  Chip,
  IconButton,
  Modal,
  Portal,
  RadioButton,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Category, Loan, LoanPayment } from "../db/database";
import { colors } from "../styles/commonStyles";
import { showConfirm, showError, showSuccess } from "../utils/alertHelper";
import { CHART, FLATLIST_CONFIG, TIMING } from "../utils/constants";
import { formatDate, getTodayString } from "../utils/dateHelper";
import {
  formatCurrency,
  formatNumberInput,
  parseNumberInput,
} from "../utils/formatCurrency";
import {
  validateNonEmptyString,
  validatePositiveAmount,
  validateSelection,
  validateSufficientBalance,
} from "../utils/validationHelper";

interface LoanItemProps {
  loan: Loan;
  categories: Category[];
  onUpdateStatus: (
    id: number,
    status: "unpaid" | "half" | "paid",
    repaymentAmount?: number
  ) => void;
  onDelete: (id: number) => void;
  onViewPayments: (loanId: number, loanName: string) => void;
}

const LoanItemComponent: React.FC<LoanItemProps> = ({
  loan,
  categories,
  onUpdateStatus,
  onDelete,
  onViewPayments,
}) => {
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState("");

  const categoryName =
    categories.find((cat) => cat.id === loan.category_id)?.name ||
    "Kategori Tidak Diketahui";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "#4CAF50";
      case "half":
        return "#FF9800";
      case "unpaid":
        return "#F44336";
      default:
        return "#999999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Lunas";
      case "half":
        return "Sebagian";
      case "unpaid":
        return "Belum Bayar";
      default:
        return "Unknown";
    }
  };

  const handleMarkPaid = () => {
    showConfirm(
      "Konfirmasi",
      `Tandai pinjaman ${loan.name} sebagai lunas?`,
      () => {
        onUpdateStatus(loan.id!, "paid");
      }
    );
  };

  const handlePartialPayment = () => {
    setRepaymentAmount("");
    setRepaymentModalVisible(true);
  };

  const handleConfirmPartialPayment = () => {
    const amount = parseNumberInput(repaymentAmount);
    if (amount <= 0 || amount > loan.amount) {
      showError(
        "Jumlah pembayaran yang anda masukkan tidak sesuai dengan jumlah pinjaman",
        "Maaf"
      );
      return;
    }

    onUpdateStatus(loan.id!, "half", amount);
    setRepaymentModalVisible(false);
  };

  const handleDelete = () => {
    showConfirm(
      "Hapus Pinjaman",
      `Apakah Anda yakin ingin menghapus pinjaman ${loan.name}?`,
      () => {
        onDelete(loan.id!);
      },
      undefined,
      "Hapus",
      "Batal"
    );
  };

  return (
    <>
      <Card style={styles.loanCard} elevation={1}>
        <Card.Content>
          <View style={styles.loanHeader}>
            <View style={styles.loanInfo}>
              <Text style={styles.loanName}>{loan.name}</Text>
              <Text style={styles.loanCategory}>Kategori: {categoryName}</Text>
              <Text style={styles.loanDate}>{formatDate(loan.date)}</Text>
              {loan.note && (
                <Text style={styles.loanNote} numberOfLines={2}>
                  📝 {loan.note}
                </Text>
              )}
            </View>

            <View style={styles.loanActions}>
              <Chip
                icon="circle"
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(loan.status) + "20" },
                ]}
                textStyle={{ color: getStatusColor(loan.status) }}
              >
                {getStatusText(loan.status)}
              </Chip>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {(loan.status === "half" || loan.status === "paid") && (
                  <IconButton
                    icon="history"
                    iconColor="#2196F3"
                    size={20}
                    onPress={() => onViewPayments(loan.id!, loan.name)}
                    style={styles.actionButton}
                  />
                )}
                {loan.status !== "paid" && (
                  <>
                    <IconButton
                      icon="check-circle"
                      iconColor="#4CAF50"
                      size={20}
                      onPress={handleMarkPaid}
                      style={styles.actionButton}
                    />
                    <IconButton
                      icon="pencil"
                      iconColor="#FF9800"
                      size={20}
                      onPress={handlePartialPayment}
                      style={styles.actionButton}
                    />
                  </>
                )}
                <IconButton
                  icon="delete"
                  iconColor="#F44336"
                  size={20}
                  onPress={handleDelete}
                  style={styles.actionButton}
                />
              </View>
            </View>
          </View>

          <View style={styles.loanAmount}>
            <Text style={styles.amountLabel}>Jumlah Pinjaman:</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(loan.amount)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Modal untuk pembayaran sebagian */}
      <Portal>
        <Modal
          visible={repaymentModalVisible}
          onDismiss={() => setRepaymentModalVisible(false)}
          contentContainerStyle={styles.repaymentModal}
        >
          <Text style={styles.modalTitle}>Pembayaran Sebagian</Text>
          <Text style={styles.modalSubtitle}>
            Pinjaman: {loan.name} ({formatCurrency(loan.amount)})
          </Text>

          <TextInput
            label="Jumlah Pembayaran"
            value={repaymentAmount}
            onChangeText={(text) => {
              const formatted = formatNumberInput(text);
              setRepaymentAmount(formatted);
            }}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            placeholder={`Maksimal: ${formatCurrency(loan.amount)}`}
            left={<TextInput.Affix text="Rp " />}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setRepaymentModalVisible(false)}
              style={styles.button}
            >
              Batal
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirmPartialPayment}
              style={styles.button}
            >
              Konfirmasi
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const LoanItem = React.memo(LoanItemComponent);

LoanItem.displayName = "LoanItem";

export const LoanScreen: React.FC = () => {
  const {
    categories,
    loans,
    loadCategories,
    loadLoans,
    addLoan,
    updateLoanStatus,
    deleteLoan,
    getLoanPayments,
  } = useApp();

  const { action } = useLocalSearchParams<{ action?: string }>();
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [paymentHistoryVisible, setPaymentHistoryVisible] = useState(false);
  const [selectedLoanName, setSelectedLoanName] = useState("");
  const [paymentHistory, setPaymentHistory] = useState<LoanPayment[]>([]);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "unpaid" | "half" | "paid"
  >("all");
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    categoryId: "",
    note: "", // Catatan tujuan pinjaman
  });

  // Refresh data saat screen difokuskan
  useFocusEffect(
    React.useCallback(() => {
      Promise.all([loadCategories(), loadLoans()]);
    }, [loadCategories, loadLoans])
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      amount: "",
      categoryId: "",
      note: "",
    });
  }, []);

  const openModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  // Handle floating action button actions
  useEffect(() => {
    if (action === "add") {
      openModal();
      // Clear parameter setelah digunakan
      router.replace("/(tabs)/loan");
    }
  }, [action, router, openModal]);

  const validateForm = (): boolean => {
    if (!validateNonEmptyString(formData.name, "Nama peminjam")) {
      return false;
    }

    const amount = parseNumberInput(formData.amount);
    if (!validatePositiveAmount(amount, "Jumlah pinjaman")) {
      return false;
    }

    if (!validateSelection(formData.categoryId, "kategori sumber pinjaman")) {
      return false;
    }

    // Validasi saldo kategori
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

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const loanData = {
        name: formData.name.trim(),
        amount: parseNumberInput(formData.amount),
        category_id: parseInt(formData.categoryId),
        status: "unpaid" as const,
        date: getTodayString(),
        note: formData.note.trim() || undefined,
      };

      await addLoan(loanData);
      closeModal();
      showSuccess("Pinjaman berhasil ditambahkan");
    } catch (error) {
      showError("Gagal menambahkan pinjaman");
    }
  };

  const handleUpdateStatus = useCallback(
    async (
      id: number,
      status: "unpaid" | "half" | "paid",
      repaymentAmount?: number
    ) => {
      try {
        await updateLoanStatus(id, status, repaymentAmount);
        showSuccess("Status pinjaman berhasil diperbarui");
      } catch (error) {
        showError("Gagal memperbarui status pinjaman");
      }
    },
    [updateLoanStatus]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteLoan(id);
        showSuccess("Pinjaman berhasil dihapus");
      } catch (error) {
        showError("Gagal menghapus pinjaman");
      }
    },
    [deleteLoan]
  );

  const handleViewPayments = useCallback(
    async (loanId: number, loanName: string) => {
      try {
        const payments = await getLoanPayments(loanId);
        setPaymentHistory(payments);
        setSelectedLoanName(loanName);
        setPaymentHistoryVisible(true);
      } catch (error) {
        showError("Gagal memuat history pembayaran");
      }
    },
    [getLoanPayments]
  );

  const handleClosePaymentHistory = useCallback(() => {
    setPaymentHistoryVisible(false);
    // Add small delay to ensure smooth transition
    setTimeout(() => {
      setPaymentHistory([]);
      setSelectedLoanName("");
    }, TIMING.MODAL_TRANSITION_DELAY);
  }, []);

  // Filter loans berdasarkan status
  const loanStats = useMemo(() => {
    return loans.reduce(
      (acc, loan) => {
        acc.totalLoans += 1;
        acc.totalAmount += loan.amount;

        if (loan.status === "unpaid") {
          acc.unpaidLoans += 1;
          acc.unpaidAmount += loan.amount;
        } else if (loan.status === "half") {
          acc.halfPaidLoans += 1;
          acc.unpaidAmount += loan.amount;
        } else if (loan.status === "paid") {
          acc.paidLoans += 1;
        }

        return acc;
      },
      {
        totalLoans: 0,
        unpaidLoans: 0,
        halfPaidLoans: 0,
        paidLoans: 0,
        totalAmount: 0,
        unpaidAmount: 0,
      }
    );
  }, [loans]);

  const filteredLoans = useMemo(
    () =>
      filterStatus === "all"
        ? loans
        : loans.filter((loan) => loan.status === filterStatus),
    [filterStatus, loans]
  );

  const {
    totalLoans,
    unpaidLoans,
    halfPaidLoans,
    paidLoans,
    totalAmount,
    unpaidAmount,
  } = loanStats;

  const headerComponent = useMemo(
    () => (
      <View>
        {/* Filter Status */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter Status:</Text>
          <View style={styles.filterChips}>
            <Chip
              selected={filterStatus === "all"}
              onPress={() => setFilterStatus("all")}
              style={styles.filterChip}
            >
              Semua ({totalLoans})
            </Chip>
            <Chip
              selected={filterStatus === "unpaid"}
              onPress={() => setFilterStatus("unpaid")}
              style={styles.filterChip}
            >
              Belum Bayar ({unpaidLoans})
            </Chip>
            <Chip
              selected={filterStatus === "half"}
              onPress={() => setFilterStatus("half")}
              style={styles.filterChip}
            >
              Sebagian ({halfPaidLoans})
            </Chip>
            <Chip
              selected={filterStatus === "paid"}
              onPress={() => setFilterStatus("paid")}
              style={styles.filterChip}
            >
              Lunas ({paidLoans})
            </Chip>
          </View>
        </View>

        {/* Statistik */}
        <Card style={styles.statsCard} elevation={2}>
          <Card.Content>
            <Text style={styles.statsTitle}>Ringkasan Pinjaman</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons
                  name="account-balance-wallet"
                  size={24}
                  color="#2196F3"
                />
                <Text style={styles.statLabel}>Total Pinjaman</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcons name="pending" size={24} color="#F44336" />
                <Text style={styles.statLabel}>Belum Terbayar</Text>
                <Text style={[styles.statValue, { color: "#F44336" }]}>
                  {formatCurrency(unpaidAmount)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    ),
    [
      filterStatus,
      halfPaidLoans,
      paidLoans,
      totalAmount,
      totalLoans,
      unpaidAmount,
      unpaidLoans,
    ]
  );

  const renderLoanItem = useCallback(
    ({ item }: { item: Loan }) => (
      <LoanItem
        loan={item}
        categories={categories}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
        onViewPayments={handleViewPayments}
      />
    ),
    [categories, handleUpdateStatus, handleDelete, handleViewPayments]
  );

  const keyExtractor = useCallback((item: Loan) => item.id!.toString(), []);

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="🤝 Kelola Pinjaman"
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <FlatList
        data={filteredLoans}
        renderItem={renderLoanItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={headerComponent}
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
            <MaterialIcons name="handshake" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Belum ada data pinjaman</Text>
          </View>
        }
      />

      {/* Modal untuk add pinjaman */}
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
            <Text style={styles.modalTitle}>Tambah Pinjaman Baru</Text>

            <TextInput
              label="Nama Peminjam"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Contoh: John Doe, Teman Kantor"
            />

            <TextInput
              label="Catatan Tujuan Pinjaman (Opsional)"
              value={formData.note}
              onChangeText={(text) => setFormData({ ...formData, note: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Contoh: Modal usaha, Biaya kuliah, Keperluan darurat"
              multiline
              numberOfLines={3}
            />

            <TextInput
              label="Jumlah Pinjaman"
              value={formData.amount}
              onChangeText={(text) => {
                const formatted = formatNumberInput(text);
                setFormData({ ...formData, amount: formatted });
              }}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Contoh: 500.000"
              left={<TextInput.Affix text="Rp " />}
            />

            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Pilih Kategori Sumber:</Text>
              <RadioButton.Group
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
                value={formData.categoryId}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        categoryId: category.id!.toString(),
                      })
                    }
                  >
                    <RadioButton value={category.id!.toString()} />
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryBalance}>
                        Saldo: {formatCurrency(category.balance)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </RadioButton.Group>
            </View>

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
                Tambah
              </Button>
            </View>
          </KeyboardAwareScrollView>
        </Modal>
      </Portal>

      {/* Modal untuk payment history */}
      <RNModal
        visible={paymentHistoryVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePaymentHistory}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentHistoryModal}>
            <Text style={styles.modalTitle}>History Pembayaran</Text>
            <Text style={styles.modalSubtitle}>
              Pinjaman: {selectedLoanName}
            </Text>

            <ScrollView
              style={styles.paymentList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {paymentHistory.length === 0 ? (
                <View style={styles.emptyPaymentHistory}>
                  <MaterialIcons name="payment" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyPaymentText}>
                    Belum ada history pembayaran
                  </Text>
                </View>
              ) : (
                paymentHistory.map((payment, index) => (
                  <Card key={payment.id || index} style={styles.paymentCard}>
                    <Card.Content>
                      <View style={styles.paymentHeader}>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentDate}>
                            {formatDate(payment.payment_date)}
                          </Text>
                          <Text style={styles.paymentAmount}>
                            {formatCurrency(payment.amount)}
                          </Text>
                        </View>
                        <Chip
                          icon="check-circle"
                          style={styles.paymentStatusChip}
                          textStyle={{ color: "#4CAF50" }}
                        >
                          Dibayar
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={handleClosePaymentHistory}
                style={styles.fullButton}
              >
                Tutup
              </Button>
            </View>
          </View>
        </View>
      </RNModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: colors.loan,
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
    padding: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.loan,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
    color: colors.loan,
    marginBottom: 16,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 4,
    textAlign: "center",
  },
  loanCard: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  loanInfo: {
    flex: 1,
  },
  loanName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  loanCategory: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  loanDate: {
    fontSize: 12,
    color: "#999999",
  },
  loanNote: {
    fontSize: 13,
    color: "#2196F3",
    marginTop: 4,
    fontStyle: "italic",
  },
  loanActions: {
    alignItems: "flex-end",
  },
  statusChip: {
    marginBottom: 8,
  },
  loanAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#666666",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
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
    color: colors.loan,
    marginBottom: 20,
    textAlign: "center",
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
  repaymentModal: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  actionButton: {
    margin: 0,
    marginLeft: 4,
  },
  paymentHistoryModal: {
    backgroundColor: "#FFFFFF",
    padding: 20, // Reduced padding for more compact design
    margin: 20,
    borderRadius: 12,
    maxHeight: "65%", // Reduced from 80% to 65%
    elevation: 0, // Remove elevation to prevent border artifacts
    shadowOpacity: 0, // Remove shadow for iOS
    borderWidth: 0, // Explicitly remove any border
    borderColor: "transparent", // Make sure border is transparent
    overflow: "hidden", // Clip any overflow content
  },
  paymentList: {
    maxHeight: CHART.MODAL_MAX_HEIGHT, // Reduced from 400 to 300
    marginVertical: 12, // Reduced from 16 to 12 for more compact design
    borderWidth: 0, // Remove any border
  },
  emptyPaymentHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyPaymentText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 12,
    textAlign: "center",
  },
  paymentCard: {
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    elevation: 0, // Remove elevation to prevent border artifacts
    shadowOpacity: 0, // Remove shadow for iOS
    borderWidth: 0, // Remove any border
    borderColor: "transparent", // Make sure border is transparent
    overflow: "hidden", // Clip any overflow content
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  paymentStatusChip: {
    backgroundColor: "#4CAF5020",
  },
  fullButton: {
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
