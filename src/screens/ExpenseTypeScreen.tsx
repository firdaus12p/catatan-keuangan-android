import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  Modal,
  Portal,
  Snackbar,
  TextInput,
} from "react-native-paper";
import { database, ExpenseType } from "../db/database";

const MAX_EXPENSE_TYPES = 10;

export default function ExpenseTypeScreen() {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Load expense types ketika screen difokuskan
  useFocusEffect(
    React.useCallback(() => {
      loadExpenseTypes();
    }, [])
  );

  const loadExpenseTypes = async () => {
    try {
      setLoading(true);
      const types = await database.getAllExpenseTypes();
      setExpenseTypes(types);
    } catch (error) {
      console.error("Error loading expense types:", error);
      showSnackbar("Gagal memuat jenis pengeluaran");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const openModal = (type?: ExpenseType) => {
    if (type) {
      setEditingType(type);
      setFormData({ name: type.name });
    } else {
      setEditingType(null);
      setFormData({ name: "" });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingType(null);
    setFormData({ name: "" });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showSnackbar("Nama jenis pengeluaran harus diisi");
      return;
    }

    if (!editingType && expenseTypes.length >= MAX_EXPENSE_TYPES) {
      showSnackbar(`Maksimal ${MAX_EXPENSE_TYPES} jenis pengeluaran`);
      return;
    }

    // Check duplicate name
    const isDuplicate = expenseTypes.some(
      (type) =>
        type.name.toLowerCase() === formData.name.toLowerCase() &&
        type.id !== editingType?.id
    );

    if (isDuplicate) {
      showSnackbar("Jenis pengeluaran dengan nama tersebut sudah ada");
      return;
    }

    try {
      setLoading(true);

      if (editingType) {
        // Update existing expense type
        await database.updateExpenseType(editingType.id!, {
          name: formData.name.trim(),
          created_at: editingType.created_at,
        });
        showSnackbar("Jenis pengeluaran berhasil diperbarui");
      } else {
        // Add new expense type
        await database.addExpenseType({
          name: formData.name.trim(),
          created_at: new Date().toISOString(),
        });
        showSnackbar("Jenis pengeluaran berhasil ditambahkan");
      }

      closeModal();
      loadExpenseTypes();
    } catch (error) {
      console.error("Error saving expense type:", error);
      showSnackbar("Gagal menyimpan jenis pengeluaran");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (type: ExpenseType) => {
    Alert.alert(
      "Hapus Jenis Pengeluaran",
      `Apakah Anda yakin ingin menghapus "${type.name}"?\n\nJenis pengeluaran yang sedang digunakan dalam transaksi tidak dapat dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => deleteExpenseType(type.id!),
        },
      ]
    );
  };

  const deleteExpenseType = async (id: number) => {
    try {
      setLoading(true);
      await database.deleteExpenseType(id);
      showSnackbar("Jenis pengeluaran berhasil dihapus");
      loadExpenseTypes();
    } catch (error: any) {
      console.error("Error deleting expense type:", error);
      if (error.message.includes("used in transactions")) {
        showSnackbar(
          "Tidak dapat menghapus jenis pengeluaran yang sedang digunakan"
        );
      } else {
        showSnackbar("Gagal menghapus jenis pengeluaran");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderExpenseType = ({ item }: { item: ExpenseType }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.typeName}>{item.name}</Text>
            <Text style={styles.createdDate}>
              Dibuat: {new Date(item.created_at).toLocaleDateString("id-ID")}
            </Text>
          </View>
          <View style={styles.actionContainer}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => openModal(item)}
              iconColor="#2196F3"
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDelete(item)}
              iconColor="#F44336"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kelola Jenis Pengeluaran</Text>
        <Text style={styles.subtitle}>
          {expenseTypes.length}/{MAX_EXPENSE_TYPES} jenis pengeluaran
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={() => openModal()}
        disabled={expenseTypes.length >= MAX_EXPENSE_TYPES}
        style={styles.addButton}
        icon="plus"
      >
        Tambah Jenis Pengeluaran
      </Button>

      <FlatList
        data={expenseTypes}
        renderItem={renderExpenseType}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada jenis pengeluaran</Text>
            <Text style={styles.emptySubtext}>
              Tambahkan jenis pengeluaran untuk mengkategorikan pengeluaran Anda
            </Text>
          </View>
        }
      />

      {/* Modal Add/Edit */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {editingType
              ? "Edit Jenis Pengeluaran"
              : "Tambah Jenis Pengeluaran"}
          </Text>

          <TextInput
            label="Nama Jenis Pengeluaran"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            style={styles.input}
            mode="outlined"
            placeholder="Contoh: Makanan, Transportasi, Hiburan"
            maxLength={50}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={closeModal}
              style={styles.cancelButton}
            >
              Batal
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
            >
              {editingType ? "Perbarui" : "Simpan"}
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  createdDate: {
    fontSize: 12,
    color: "#666",
  },
  actionContainer: {
    flexDirection: "row",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  snackbar: {
    backgroundColor: "#333",
  },
});
