import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  IconButton,
  Modal,
  Portal,
  RadioButton,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { Category, Loan, LoanPayment } from "../db/database";
import { formatDate, getTodayString } from "../utils/dateHelper";
import {
  formatCurrency,
  formatNumberInput,
  parseNumberInput,
} from "../utils/formatCurrency";

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

const LoanItem: React.FC<LoanItemProps> = ({
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
    Alert.alert("Konfirmasi", `Tandai pinjaman ${loan.name} sebagai lunas?`, [
      {
        text: "Batal",
        style: "cancel",
      },
      {
        text: "Ya",
        onPress: () => {
          onUpdateStatus(loan.id!, "paid");
        },
      },
    ]);
  };

  const handlePartialPayment = () => {
    setRepaymentAmount("");
    setRepaymentModalVisible(true);
  };

  const handleConfirmPartialPayment = () => {
    const amount = parseNumberInput(repaymentAmount);
    if (amount <= 0 || amount > loan.amount) {
      Alert.alert("Error", "Jumlah pembayaran tidak valid");
      return;
    }

    onUpdateStatus(loan.id!, "half", amount);
    setRepaymentModalVisible(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Hapus Pinjaman",
      `Apakah Anda yakin ingin menghapus pinjaman ${loan.name}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            onDelete(loan.id!);
          },
        },
      ]
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
  });

  // Handle floating action button actions
  useEffect(() => {
    if (action === "add") {
      openModal();
      // Clear parameter setelah digunakan
      router.replace("/(tabs)/loan");
    }
  }, [action]);

  // Refresh data saat screen difokuskan
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
      loadLoans();

      // Cleanup function saat screen blur/unfocus
      return () => {
        // LoanScreen blur - closing all menus for better UX
      };
    }, [])
  );

  // Cleanup placeholder (dipertahankan untuk konsistensi hook)
  useEffect(() => {
    return () => {
      // no specific teardown needed
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      categoryId: "",
    });
  };

  const openModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Nama peminjam tidak boleh kosong");
      return false;
    }

    const amount = parseNumberInput(formData.amount);
    if (amount <= 0) {
      Alert.alert("Error", "Jumlah pinjaman harus lebih dari 0");
      return false;
    }

    if (!formData.categoryId) {
      Alert.alert("Error", "Pilih kategori sumber pinjaman");
      return false;
    }

    // Validasi saldo kategori
    const selectedCategory = categories.find(
      (cat) => cat.id!.toString() === formData.categoryId
    );
    if (selectedCategory && selectedCategory.balance < amount) {
      Alert.alert(
        "Error",
        `Saldo kategori "${
          selectedCategory.name
        }" tidak mencukupi.\nSaldo: ${formatCurrency(selectedCategory.balance)}`
      );
      return false;
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
      };

      await addLoan(loanData);
      closeModal();
      Alert.alert("Sukses", "Pinjaman berhasil ditambahkan");
    } catch (error) {
      Alert.alert("Error", "Gagal menambahkan pinjaman");
      console.error("Error saving loan:", error);
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
        Alert.alert("Sukses", "Status pinjaman berhasil diperbarui");
      } catch (error) {
        Alert.alert("Error", "Gagal memperbarui status pinjaman");
        console.error("Error updating loan status:", error);
      }
    },
    [updateLoanStatus]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteLoan(id);
        Alert.alert("Sukses", "Pinjaman berhasil dihapus");
      } catch (error) {
        Alert.alert("Error", "Gagal menghapus pinjaman");
        console.error("Error deleting loan:", error);
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
        Alert.alert("Error", "Gagal memuat history pembayaran");
        console.error("Error loading payment history:", error);
      }
    },
    [getLoanPayments]
  );

  // Filter loans berdasarkan status
  const filteredLoans =
    filterStatus === "all"
      ? loans
      : loans.filter((loan) => loan.status === filterStatus);

  // Statistik pinjaman
  const totalLoans = loans.length;
  const unpaidLoans = loans.filter((loan) => loan.status === "unpaid").length;
  const halfPaidLoans = loans.filter((loan) => loan.status === "half").length;
  const paidLoans = loans.filter((loan) => loan.status === "paid").length;
  const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const unpaidAmount = loans
    .filter((loan) => loan.status === "unpaid")
    .reduce((sum, loan) => sum + loan.amount, 0);

  const renderHeader = () => (
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

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="Kelola Pinjaman"
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <FlatList
        data={filteredLoans}
        renderItem={renderLoanItem}
        keyExtractor={(item) => item.id!.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
          <ScrollView showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal untuk payment history */}
      <Portal>
        <Modal
          visible={paymentHistoryVisible}
          onDismiss={() => setPaymentHistoryVisible(false)}
          contentContainerStyle={styles.paymentHistoryModal}
        >
          <Text style={styles.modalTitle}>History Pembayaran</Text>
          <Text style={styles.modalSubtitle}>Pinjaman: {selectedLoanName}</Text>

          <ScrollView
            style={styles.paymentList}
            showsVerticalScrollIndicator={false}
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
              onPress={() => setPaymentHistoryVisible(false)}
              style={styles.fullButton}
            >
              Tutup
            </Button>
          </View>
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
    padding: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
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
    color: "#333333",
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
    color: "#333333",
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
    padding: 24,
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  paymentList: {
    maxHeight: 400,
    marginVertical: 16,
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
});
