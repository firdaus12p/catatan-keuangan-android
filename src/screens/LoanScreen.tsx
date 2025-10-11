import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Dialog,
  FAB,
  HelperText,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAppContext, type Loan } from "@/src/context/AppContext";
import { formatCurrency } from "@/src/utils/formatCurrency";

interface LoanFormState {
  name: string;
  amount: string;
  categoryId: number | null;
}

export default function LoanScreen() {
  const {
    loans,
    categories,
    addLoan,
    payLoanHalf,
    payLoanFull,
    deleteLoan,
  } = useAppContext();
  const theme = useTheme();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState<LoanFormState>({ name: "", amount: "", categoryId: null });
  const [isSubmitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; isError?: boolean }>({
    visible: false,
    message: "",
    isError: false,
  });

  const resetForm = useCallback(() => {
    setForm({ name: "", amount: "", categoryId: null });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogVisible(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim()) {
      setSnackbar({ visible: true, message: "Nama peminjam wajib diisi.", isError: true });
      return;
    }
    const amountValue = Number(form.amount.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setSnackbar({ visible: true, message: "Nominal pinjaman tidak valid.", isError: true });
      return;
    }
    if (!form.categoryId) {
      setSnackbar({ visible: true, message: "Pilih kategori sumber dana.", isError: true });
      return;
    }

    setSubmitting(true);
    try {
      await addLoan({
        name: form.name.trim(),
        amount: amountValue,
        categoryId: form.categoryId,
      });
      setSnackbar({ visible: true, message: "Pinjaman berhasil dicatat." });
      closeDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tidak dapat menyimpan pinjaman.";
      setSnackbar({ visible: true, message, isError: true });
    } finally {
      setSubmitting(false);
    }
  }, [addLoan, closeDialog, form.amount, form.categoryId, form.name]);

  const confirmAction = useCallback(
    (title: string, message: string, action: () => Promise<void>) => {
      Alert.alert(
        title,
        message,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Lanjutkan",
            style: "default",
            onPress: () => {
              action().catch((error) => {
                const err = error instanceof Error ? error.message : "Terjadi kesalahan.";
                setSnackbar({ visible: true, message: err, isError: true });
              });
            },
          },
        ],
        { cancelable: true },
      );
    },
    [],
  );

  const renderLoanCard = ({ item }: { item: Loan }) => {
    const category = categories.find((cat) => cat.id === item.categoryId);
    const statusColor =
      item.status === "paid"
        ? theme.colors.secondary
        : item.status === "half"
          ? theme.colors.tertiary
          : theme.colors.error;

    return (
      <Card style={styles.card} mode="elevated">
        <Card.Title
          title={item.name}
          subtitle={category ? `Kategori: ${category.name}` : "Kategori tidak tersedia"}
          right={() => (
            <Chip style={{ backgroundColor: statusColor, marginRight: 8 }} textStyle={{ color: "#0F172A" }}>
              {item.status === "paid" ? "Lunas" : item.status === "half" ? "Setengah" : "Belum"}
            </Chip>
          )}
        />
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium">{formatCurrency(item.amount)}</Text>
          <Text style={{ color: theme.colors.outline }}>
            Tanggal: {new Date(item.date).toLocaleDateString("id-ID")}
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button
            icon="cash-100"
            onPress={() =>
              confirmAction(
                "Pelunasan pinjaman",
                `Konfirmasi pelunasan pinjaman ${item.name}?`,
                () => payLoanFull(item.id),
              )
            }
            disabled={item.status === "paid"}
          >
            Lunas
          </Button>
          <Button
            icon="cash-refund"
            onPress={() =>
              confirmAction(
                "Pembayaran 50%",
                `Terima pembayaran setengah untuk pinjaman ${item.name}?`,
                () => payLoanHalf(item.id),
              )
            }
            disabled={item.status !== "unpaid"}
          >
            Bayar 50%
          </Button>
          <Button
            icon="delete-outline"
            textColor={theme.colors.error}
            onPress={() =>
              confirmAction(
                "Hapus pinjaman",
                `Yakin akan menghapus catatan pinjaman ${item.name}?`,
                () => deleteLoan(item.id),
              )
            }
          >
            Hapus
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={renderLoanCard}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Belum ada data pinjaman. Tekan tombol tambah untuk menambahkan.</Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setDialogVisible(true)} />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>Catat Pinjaman</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Nama peminjam"
              mode="outlined"
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />
            <TextInput
              label="Nominal"
              mode="outlined"
              value={form.amount}
              onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value.replace(/[^0-9.,]/g, "") }))}
              keyboardType="decimal-pad"
              left={<TextInput.Icon icon="cash" />}
            />
            <Text style={{ color: theme.colors.outline }}>
              {form.categoryId
                ? `Kategori terpilih: ${
                    categories.find((item) => item.id === form.categoryId)?.name ?? "-"
                  }`
                : "Pilih salah satu kategori sumber dana"}
            </Text>
            <View style={styles.categoryChoices}>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  selected={form.categoryId === category.id}
                  onPress={() => setForm((prev) => ({ ...prev, categoryId: category.id }))}
                  style={styles.categoryChip}
                >
                  {category.name}
                </Chip>
              ))}
            </View>
            <HelperText type="info" visible>
              Saldo kategori akan berkurang saat pinjaman dicatat dan kembali ketika dibayar.
            </HelperText>
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
  list: {
    gap: 12,
    paddingBottom: 80,
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    gap: 4,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  dialogContent: {
    gap: 12,
  },
  categoryChoices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
  },
  snackbarError: {
    backgroundColor: "#EF5350",
  },
});
