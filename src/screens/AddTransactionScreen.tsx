import { useCallback, useMemo, useState } from "react";
import { Keyboard, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  HelperText,
  Menu,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAppContext } from "@/src/context/AppContext";
import { formatCurrency } from "@/src/utils/formatCurrency";

type TransactionMode = "global-income" | "category-income" | "expense";

export default function AddTransactionScreen() {
  const {
    categories,
    addGlobalIncome,
    addCategoryIncome,
    addExpense,
  } = useAppContext();
  const theme = useTheme();
  const router = useRouter();

  const [mode, setMode] = useState<TransactionMode>("global-income");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; isError?: boolean }>({
    visible: false,
    message: "",
    isError: false,
  });

  const requiresCategory = mode !== "global-income";
  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const handleSubmit = useCallback(async () => {
    const amountValue = Number(amount.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setSnackbar({ visible: true, message: "Nominal harus lebih dari 0.", isError: true });
      return;
    }
    if (requiresCategory && !selectedCategory) {
      setSnackbar({ visible: true, message: "Pilih kategori terlebih dahulu.", isError: true });
      return;
    }

    setSubmitting(true);
    Keyboard.dismiss();

    try {
      if (mode === "global-income") {
        await addGlobalIncome({
          amount: amountValue,
          note: note || "Pemasukan global",
        });
      } else if (mode === "category-income" && selectedCategory) {
        await addCategoryIncome({
          categoryId: selectedCategory.id,
          amount: amountValue,
          note: note || `Pemasukan ke ${selectedCategory.name}`,
        });
      } else if (mode === "expense" && selectedCategory) {
        await addExpense({
          categoryId: selectedCategory.id,
          amount: amountValue,
          note: note || `Pengeluaran dari ${selectedCategory.name}`,
        });
      }

      setSnackbar({ visible: true, message: "Transaksi berhasil disimpan." });
      setAmount("");
      setNote("");
      setCategoryId(null);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tidak dapat menyimpan transaksi.";
      setSnackbar({ visible: true, message, isError: true });
    } finally {
      setSubmitting(false);
    }
  }, [
    addCategoryIncome,
    addExpense,
    addGlobalIncome,
    amount,
    mode,
    note,
    requiresCategory,
    router,
    selectedCategory,
  ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge">Tambah Transaksi</Text>
      <Text style={{ color: theme.colors.outline }}>
        Pilih jenis transaksi dan lengkapi detailnya.
      </Text>

      <SegmentedButtons
        value={mode}
        onValueChange={(value) => {
          setMode(value as TransactionMode);
          setCategoryId(null);
        }}
        buttons={[
          { value: "global-income", label: "Pemasukan Global" },
          { value: "category-income", label: "Pemasukan Kategori" },
          { value: "expense", label: "Pengeluaran" },
        ]}
        style={styles.segmented}
      />

      <TextInput
        mode="outlined"
        label="Nominal"
        value={amount}
        onChangeText={(value) => setAmount(value.replace(/[^0-9.,]/g, ""))}
        keyboardType="decimal-pad"
        left={<TextInput.Icon icon="cash" />}
      />

      {amount ? (
        <Text style={{ color: theme.colors.outline }}>
          {formatCurrency(Number(amount.replace(/\./g, "").replace(",", ".")))}
        </Text>
      ) : null}

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            icon="shape"
            onPress={() => setMenuVisible(true)}
            disabled={!requiresCategory}
          >
            {selectedCategory ? selectedCategory.name : "Pilih kategori"}
          </Button>
        }
      >
        {categories.map((category) => (
          <Menu.Item
            key={category.id}
            onPress={() => {
              setCategoryId(category.id);
              setMenuVisible(false);
            }}
            title={`${category.name} (${category.percentage}% - ${formatCurrency(category.balance)})`}
          />
        ))}
      </Menu>
      <HelperText type="info" visible>
        {mode === "global-income"
          ? "Pemasukan global akan dibagi otomatis sesuai persentase kategori."
          : "Saldo kategori akan menyesuaikan nilai transaksi."}
      </HelperText>

      <TextInput
        mode="outlined"
        label="Catatan (opsional)"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
      />

      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => router.back()}>
          Batal
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Simpan
        </Button>
      </View>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((prev) => ({ ...prev, visible: false }))}
        duration={4000}
        style={snackbar.isError ? styles.snackbarError : undefined}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  segmented: {
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  snackbarError: {
    backgroundColor: "#EF5350",
  },
});
