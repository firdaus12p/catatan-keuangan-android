import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
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
  Divider,
  FAB,
  Modal,
  Portal,
  Surface,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryCard } from "../components/CategoryCard";
import { useApp } from "../context/AppContext";
import { Category } from "../db/database";
import { formatCurrency } from "../utils/formatCurrency";

export const CategoryScreen: React.FC = () => {
  const {
    categories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    percentage: "",
  });

  // Refresh data saat screen difokuskan
  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, [])
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

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Nama kategori tidak boleh kosong");
      return false;
    }

    const percentage = parseFloat(formData.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      Alert.alert("Error", "Persentase harus antara 1-100");
      return false;
    }

    // Validasi total persentase tidak boleh lebih dari 100%
    const currentTotal = categories
      .filter((cat) => (editingCategory ? cat.id !== editingCategory.id : true))
      .reduce((sum, cat) => sum + cat.percentage, 0);

    if (currentTotal + percentage > 100) {
      Alert.alert(
        "Error",
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
      Alert.alert(
        "Sukses",
        editingCategory
          ? "Kategori berhasil diperbarui"
          : "Kategori berhasil ditambahkan"
      );
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan kategori");
      console.error("Error saving category:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      Alert.alert("Sukses", "Kategori berhasil dihapus");
    } catch (error) {
      Alert.alert("Error", "Gagal menghapus kategori");
      console.error("Error deleting category:", error);
    }
  };

  // Hitung total saldo dan persentase
  const totalBalance = categories.reduce((sum, cat) => sum + cat.balance, 0);
  const totalPercentage = categories.reduce(
    (sum, cat) => sum + cat.percentage,
    0
  );

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
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="Kelola Kategori"
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
      />

      {/* FAB untuk tambah kategori */}
      <Portal>
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={openAddModal}
          label="Tambah Kategori"
        />
      </Portal>

      {/* Modal untuk add/edit kategori */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
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
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 100,
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
    color: "#333333",
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
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
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
});
