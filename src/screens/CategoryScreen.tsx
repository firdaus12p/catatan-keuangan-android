import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  InteractionManager,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Appbar,
  Button,
  Divider,
  Modal,
  Portal,
  RadioButton,
  Surface,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryCard } from "../components/CategoryCard";
import { useApp } from "../context/AppContext";
import { Category } from "../db/database";
import { colors } from "../styles/commonStyles";
import { showError, showSuccess } from "../utils/alertHelper";
import { FLATLIST_CONFIG } from "../utils/constants";
import {
  formatCurrency,
  formatNumberInput,
  parseNumberInput,
} from "../utils/formatCurrency";
import {
  validateNonEmptyString,
  validatePercentage,
  validatePositiveAmount,
  validateSelection,
  validateSufficientBalance,
} from "../utils/validationHelper";

export const CategoryScreen: React.FC = () => {
  const {
    categories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    transferCategoryBalance,
  } = useApp();

  const { action } = useLocalSearchParams<{ action?: string }>();
  const router = useRouter();

  useEffect(() => {
    router.prefetch({ pathname: "/(tabs)/transaction" });
    router.prefetch({ pathname: "/(tabs)/loan" });
  }, [router]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    percentage: "",
  });
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferSourceCategory, setTransferSourceCategory] =
    useState<Category | null>(null);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // Handle floating action button actions
  useEffect(() => {
    if (action === "add") {
      openAddModal();
      // Clear parameter setelah digunakan
      router.replace("/(tabs)/category");
    }
  }, [action]);

  // Refresh data saat screen difokuskan
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const task = InteractionManager.runAfterInteractions(() => {
        if (!isMounted) return;
        loadCategories();
      });

      return () => {
        isMounted = false;
        if (task && typeof task.cancel === "function") {
          task.cancel();
        }
      };
    }, [loadCategories])
  );

  const resetForm = () => {
    setFormData({ name: "", percentage: "" });
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      percentage: category.percentage.toString(),
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const openTransferModal = (category: Category) => {
    setTransferSourceCategory(category);
    const defaultTarget = categories.find((cat) => cat.id !== category.id);
    setTransferTargetId(defaultTarget?.id?.toString() ?? "");
    setTransferAmount("");
    setTransferModalVisible(true);
  };

  const closeTransferModal = () => {
    setTransferModalVisible(false);
    setTransferSourceCategory(null);
    setTransferTargetId("");
    setTransferAmount("");
    setTransferLoading(false);
  };

  const validateForm = (): boolean => {
    if (!validateNonEmptyString(formData.name.trim(), "Nama kategori")) {
      return false;
    }

    const percentage = parseFloat(formData.percentage);
    if (!validatePercentage(percentage)) {
      return false;
    }

    // Validasi total persentase tidak boleh lebih dari 100%
    const currentTotal = categories
      .filter((cat) => (editingCategory ? cat.id !== editingCategory.id : true))
      .reduce((sum, cat) => sum + cat.percentage, 0);

    if (currentTotal + percentage > 100) {
      showError(
        `Total persentase akan menjadi ${(currentTotal + percentage).toFixed(
          1
        )}%. Maximum adalah 100%.`
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const categoryData = {
        name: formData.name.trim(),
        percentage: parseFloat(formData.percentage),
        balance: editingCategory ? editingCategory.balance : 0,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id!, categoryData);
      } else {
        await addCategory(categoryData);
      }

      closeModal();
      showSuccess(
        editingCategory
          ? "Kategori berhasil diperbarui"
          : "Kategori berhasil ditambahkan"
      );
    } catch (error) {
      showError("Gagal menyimpan kategori");
      console.error("Error saving category:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      showSuccess("Kategori berhasil dihapus");
    } catch (error) {
      showError("Gagal menghapus kategori");
      console.error("Error deleting category:", error);
    }
  };

  // Hitung total saldo dan persentase dengan memoization
  const { totalBalance, totalPercentage } = useMemo(() => {
    const balance = categories.reduce((sum, cat) => sum + cat.balance, 0);
    const percentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
    return { totalBalance: balance, totalPercentage: percentage };
  }, [categories]);

  const availableTransferTargets = useMemo(() => {
    if (!transferSourceCategory?.id) {
      return categories;
    }

    return categories.filter((cat) => cat.id !== transferSourceCategory.id);
  }, [categories, transferSourceCategory]);

  const hasTransferTargets = availableTransferTargets.length > 0;

  const handleTransferSubmit = async (): Promise<void> => {
    if (!transferSourceCategory?.id) {
      return;
    }

    const amountValue = parseNumberInput(transferAmount);

    if (!validateSelection(transferTargetId, "kategori tujuan")) {
      return;
    }

    if (transferSourceCategory.id!.toString() === transferTargetId) {
      showError("Kategori tujuan tidak boleh sama dengan kategori sumber");
      return;
    }

    if (!validatePositiveAmount(amountValue, "Jumlah yang dipindahkan")) {
      return;
    }

    if (
      !validateSufficientBalance(
        transferSourceCategory.balance,
        amountValue,
        `"${transferSourceCategory.name}"`
      )
    ) {
      return;
    }

    setTransferLoading(true);
    try {
      const targetIdNumber = parseInt(transferTargetId, 10);
      await transferCategoryBalance(
        transferSourceCategory.id!,
        targetIdNumber,
        amountValue
      );

      const targetName = categories.find(
        (cat) => cat.id === targetIdNumber
      )?.name;

      showSuccess(
        `Saldo sebesar ${formatCurrency(
          amountValue
        )} berhasil dipindahkan ke kategori "${targetName ?? "Tujuan"}"`
      );
      closeTransferModal();
    } catch (error) {
      console.error("Error transferring category balance:", error);
      showError("Gagal memindahkan saldo kategori");
    } finally {
      setTransferLoading(false);
    }
  };

  const renderHeader = () => (
    <Surface style={styles.summaryContainer} elevation={1}>
      <Text style={styles.summaryTitle}>Ringkasan Kategori</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Saldo:</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalBalance)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Alokasi:</Text>
        <Text
          style={[
            styles.summaryValue,
            {
              color:
                totalPercentage > 100
                  ? "#F44336"
                  : totalPercentage === 100
                  ? "#4CAF50"
                  : "#FF9800",
            },
          ]}
        >
          {totalPercentage.toFixed(1)}%
        </Text>
      </View>
      {totalPercentage !== 100 && (
        <Text style={styles.warningText}>
          {totalPercentage > 100
            ? `Alokasi melebihi 100% sebesar ${(totalPercentage - 100).toFixed(
                1
              )}%`
            : `Sisa alokasi: ${(100 - totalPercentage).toFixed(1)}%`}
        </Text>
      )}
      <Divider style={styles.divider} />
    </Surface>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <CategoryCard
      category={item}
      onEdit={openEditModal}
      onDelete={handleDelete}
      onTransfer={openTransferModal}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="📁 Kelola Kategori"
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id!.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        // ✅ OPTIMIZED: FlatList performance props
        maxToRenderPerBatch={FLATLIST_CONFIG.CATEGORY.MAX_TO_RENDER_PER_BATCH}
        windowSize={FLATLIST_CONFIG.CATEGORY.WINDOW_SIZE}
        removeClippedSubviews={true}
        initialNumToRender={FLATLIST_CONFIG.CATEGORY.INITIAL_NUM_TO_RENDER}
        updateCellsBatchingPeriod={
          FLATLIST_CONFIG.CATEGORY.UPDATE_CELLS_BATCHING_PERIOD
        }
      />

      <Portal>
        <Modal
          visible={transferModalVisible}
          onDismiss={closeTransferModal}
          contentContainerStyle={styles.transferModal}
        >
          <KeyboardAwareScrollView
            showsVerticalScrollIndicator={false}
            enableOnAndroid
            extraScrollHeight={20}
          >
            <Text style={styles.modalTitle}>Transfer Saldo Kategori</Text>
            <Text style={styles.infoText}>
              Dari: {transferSourceCategory?.name ?? "-"}
            </Text>
            <Text style={styles.infoText}>
              Saldo tersedia:{" "}
              {formatCurrency(transferSourceCategory?.balance ?? 0)}
            </Text>

            <TextInput
              label="Jumlah yang Dipindahkan"
              value={transferAmount}
              onChangeText={(text) => {
                const formatted = formatNumberInput(text);
                setTransferAmount(formatted);
              }}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Contoh: 50.000"
              left={<TextInput.Affix text="Rp " />}
            />

            <Text style={styles.transferLabel}>Kategori Tujuan:</Text>
            {hasTransferTargets ? (
              <RadioButton.Group
                onValueChange={setTransferTargetId}
                value={transferTargetId}
              >
                {availableTransferTargets.map((target) => (
                  <View key={target.id} style={styles.transferTargetItem}>
                    <RadioButton value={target.id!.toString()} />
                    <View style={styles.transferTargetInfo}>
                      <Text style={styles.transferTargetName}>
                        {target.name}
                      </Text>
                      <Text style={styles.transferTargetBalance}>
                        Saldo: {formatCurrency(target.balance)}
                      </Text>
                    </View>
                  </View>
                ))}
              </RadioButton.Group>
            ) : (
              <Text style={styles.emptyTransferText}>
                Tidak ada kategori lain yang tersedia untuk menerima saldo.
              </Text>
            )}

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={closeTransferModal}
                style={styles.button}
                disabled={transferLoading}
              >
                Batal
              </Button>
              <Button
                mode="contained"
                onPress={handleTransferSubmit}
                style={styles.button}
                loading={transferLoading}
                disabled={transferLoading || !hasTransferTargets}
              >
                Transfer
              </Button>
            </View>
          </KeyboardAwareScrollView>
        </Modal>
      </Portal>

      {/* Modal untuk add/edit kategori */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <KeyboardAwareScrollView
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalTitle}>
              {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
            </Text>

            <TextInput
              label="Nama Kategori"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Contoh: Belanja, Transportasi"
            />

            <TextInput
              label="Persentase Alokasi (%)"
              value={formData.percentage}
              onChangeText={(text) =>
                setFormData({ ...formData, percentage: text })
              }
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Contoh: 25"
              right={<TextInput.Affix text="%" />}
            />

            <Text style={styles.infoText}>
              Total alokasi saat ini: {totalPercentage.toFixed(1)}%
            </Text>

            {editingCategory && (
              <Text style={styles.infoText}>
                Saldo saat ini: {formatCurrency(editingCategory.balance)}
              </Text>
            )}

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
                {editingCategory ? "Perbarui" : "Tambah"}
              </Button>
            </View>
          </KeyboardAwareScrollView>
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
    backgroundColor: colors.category,
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
  summaryContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.category,
    marginBottom: 12,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  warningText: {
    fontSize: 12,
    color: "#FF9800",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
  },
  divider: {
    marginTop: 12,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
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
  infoText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
    textAlign: "center",
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
  transferModal: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  transferLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  transferTargetItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  transferTargetInfo: {
    marginLeft: 8,
    flex: 1,
  },
  transferTargetName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  transferTargetBalance: {
    fontSize: 12,
    color: "#666666",
  },
  emptyTransferText: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 12,
    textAlign: "center",
  },
});
