import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
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
  FAB,
  Modal,
  Portal,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppContext } from "../context/AppContext";
import { ExpenseType } from "../db/database";
import { colors } from "../styles/commonStyles";

const DEFAULT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FFB347",
  "#F39C12",
  "#E74C3C",
  "#9B59B6",
  "#3498DB",
  "#2ECC71",
  "#F1C40F",
  "#E67E22",
  "#34495E",
  "#95A5A6",
];

export const ExpenseTypeScreen: React.FC = () => {
  const router = useRouter();
  const {
    expenseTypes,
    loadExpenseTypes,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
  } = useAppContext();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpenseType, setEditingExpenseType] =
    useState<ExpenseType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: DEFAULT_COLORS[0],
  });

  // Load data saat screen focus
  useFocusEffect(
    useCallback(() => {
      loadExpenseTypes();
    }, [loadExpenseTypes])
  );

  const openModal = (expenseType?: ExpenseType) => {
    if (expenseType) {
      setEditingExpenseType(expenseType);
      setFormData({
        name: expenseType.name,
        color: expenseType.color || DEFAULT_COLORS[0],
      });
    } else {
      setEditingExpenseType(null);
      setFormData({
        name: "",
        color: DEFAULT_COLORS[0],
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingExpenseType(null);
    setFormData({
      name: "",
      color: DEFAULT_COLORS[0],
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Nama jenis pengeluaran tidak boleh kosong");
      return;
    }

    try {
      if (editingExpenseType) {
        // Update existing expense type
        await updateExpenseType(editingExpenseType.id!, {
          name: formData.name.trim(),
          color: formData.color,
        });
        Alert.alert("Sukses", "Jenis pengeluaran berhasil diperbarui");
      } else {
        // Add new expense type
        await addExpenseType({
          name: formData.name.trim(),
          color: formData.color,
        });
        Alert.alert("Sukses", "Jenis pengeluaran berhasil ditambahkan");
      }

      closeModal();
      loadExpenseTypes();
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan jenis pengeluaran");
      console.error("Error saving expense type:", error);
    }
  };

  const handleDelete = (expenseType: ExpenseType) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Yakin ingin menghapus jenis pengeluaran "${expenseType.name}"?\n\nTransaksi yang menggunakan jenis ini akan diubah menjadi "Tidak Ditentukan".`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteExpenseType(expenseType.id!);
              Alert.alert("Sukses", "Jenis pengeluaran berhasil dihapus");
              loadExpenseTypes();
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus jenis pengeluaran");
              console.error("Error deleting expense type:", error);
            }
          },
        },
      ]
    );
  };

  const renderExpenseTypeItem = ({ item }: { item: ExpenseType }) => (
    <Card style={styles.expenseTypeCard}>
      <Card.Content style={styles.expenseTypeContent}>
        <View style={styles.expenseTypeInfo}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: item.color || DEFAULT_COLORS[0] },
            ]}
          />
          <Text style={styles.expenseTypeName}>{item.name}</Text>
        </View>
        <View style={styles.expenseTypeActions}>
          <TouchableOpacity
            onPress={() => openModal(item)}
            style={styles.actionButton}
          >
            <MaterialIcons name="edit" size={20} color={colors.income} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.actionButton}
          >
            <MaterialIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderColorSelector = () => (
    <View style={styles.colorSelectorContainer}>
      <Text style={styles.colorSelectorLabel}>Pilih Warna:</Text>
      <View style={styles.colorGrid}>
        {DEFAULT_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.color === color && styles.selectedColor,
            ]}
            onPress={() => setFormData({ ...formData, color })}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} iconColor="white" />
        <Appbar.Content
          title="Pengaturan Jenis Pengeluaran"
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <View style={styles.content}>
        {expenseTypes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="category" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Belum ada jenis pengeluaran</Text>
            <Text style={styles.emptySubtext}>
              Tambahkan jenis pengeluaran untuk melacak kebiasaan pengeluaran
              Anda
            </Text>
          </View>
        ) : (
          <FlatList
            data={expenseTypes}
            renderItem={renderExpenseTypeItem}
            keyExtractor={(item) => item.id!.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => openModal()}
        color="white"
      />

      {/* Modal untuk tambah/edit jenis pengeluaran */}
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
              {editingExpenseType
                ? "Edit Jenis Pengeluaran"
                : "Tambah Jenis Pengeluaran"}
            </Text>

            <TextInput
              label="Nama Jenis Pengeluaran"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Contoh: Makanan & Minuman"
            />

            {renderColorSelector()}

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
                disabled={!formData.name.trim()}
              >
                {editingExpenseType ? "Perbarui" : "Simpan"}
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: colors.income,
    elevation: 4,
    height: 64,
    minHeight: 64,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    marginTop: 4,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  expenseTypeCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  expenseTypeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  expenseTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  expenseTypeName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  expenseTypeActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999999",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.income,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.income,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  colorSelectorContainer: {
    marginBottom: 20,
  },
  colorSelectorLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    color: "#333333",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#333333",
    borderWidth: 3,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
