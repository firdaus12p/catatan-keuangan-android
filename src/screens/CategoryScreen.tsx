import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  FAB,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { CategoryCard } from "@/src/components/CategoryCard";
import { useAppContext, type Category } from "@/src/context/AppContext";
import { formatCurrency } from "@/src/utils/formatCurrency";

interface FormState {
  name: string;
  percentage: string;
}

export default function CategoryScreen() {
  const { categories, addCategory, updateCategory, removeCategory, loading } = useAppContext();
  const theme = useTheme();
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", percentage: "" });
  const [isSubmitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; isError?: boolean }>({
    visible: false,
    message: "",
    isError: false,
  });

  const totalBalance = useMemo(
    () => categories.reduce((acc, item) => acc + item.balance, 0),
    [categories],
  );
  const totalPercentage = useMemo(
    () => categories.reduce((acc, item) => acc + item.percentage, 0),
    [categories],
  );

  const resetForm = () => {
    setForm({ name: "", percentage: "" });
    setEditingCategory(null);
  };

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogVisible(true);
  }, []);

  const openEditDialog = useCallback((category: Category) => {
    setEditingCategory(category);
    setForm({ name: category.name, percentage: String(category.percentage) });
    setDialogVisible(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogVisible(false);
    resetForm();
  }, []);

  const handleSubmit = useCallback(async () => {
    const percentageValue = Number(form.percentage.replace(",", "."));
    if (!form.name.trim()) {
      setSnackbar({ visible: true, message: "Nama kategori tidak boleh kosong.", isError: true });
      return;
    }
    if (Number.isNaN(percentageValue)) {
      setSnackbar({ visible: true, message: "Persentase harus berupa angka.", isError: true });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: form.name.trim(),
          percentage: percentageValue,
        });
        setSnackbar({ visible: true, message: "Kategori berhasil diperbarui." });
      } else {
        await addCategory({ name: form.name.trim(), percentage: percentageValue });
        setSnackbar({ visible: true, message: "Kategori baru ditambahkan." });
      }
      closeDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan kategori.";
      setSnackbar({ visible: true, message, isError: true });
    } finally {
      setSubmitting(false);
    }
  }, [addCategory, closeDialog, editingCategory, form.name, form.percentage, updateCategory]);

  const confirmDelete = useCallback(
    (category: Category) => {
      Alert.alert(
        "Hapus kategori",
        `Anda yakin ingin menghapus kategori "${category.name}"?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              try {
                await removeCategory(category.id);
                setSnackbar({ visible: true, message: "Kategori berhasil dihapus." });
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Tidak dapat menghapus kategori ini.";
                setSnackbar({ visible: true, message, isError: true });
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [removeCategory],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="titleLarge">Kategori</Text>
          <Text style={{ color: theme.colors.outline }}>
            Total saldo kategori: {formatCurrency(totalBalance)}
          </Text>
        </View>
        <Text style={{ color: theme.colors.outline }}>
          Total persentase: {totalPercentage.toFixed(2)}%
        </Text>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator animating size="large" />
          <Text>Memuat data kategori...</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onEdit={openEditDialog}
              onDelete={confirmDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>Tidak ada kategori. Tambahkan kategori baru sekarang.</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={openAddDialog} />

      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>
            {editingCategory ? "Edit Kategori" : "Kategori Baru"}
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Nama kategori"
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              mode="outlined"
            />
            <TextInput
              label="Persentase (%)"
              value={form.percentage}
              onChangeText={(value) => setForm((prev) => ({ ...prev, percentage: value }))}
              mode="outlined"
              keyboardType="decimal-pad"
              right={<TextInput.Affix text="%" />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Batal</Button>
            <Button loading={isSubmitting} onPress={handleSubmit}>
              Simpan
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((prev) => ({ ...prev, visible: false }))}
        duration={4000}
        style={snackbar.isError ? styles.snackbarError : undefined}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 80,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  dialogContent: {
    gap: 12,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  snackbarError: {
    backgroundColor: "#EF5350",
  },
});
