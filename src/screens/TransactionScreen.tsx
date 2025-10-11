import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FAB,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { TransactionItem } from "@/src/components/TransactionItem";
import { useAppContext } from "@/src/context/AppContext";

export default function TransactionScreen() {
  const {
    transactions,
    transactionsPagination,
    loadMoreTransactions,
    reloadTransactions,
    transactionFilter,
    setTransactionFilter,
  } = useAppContext();
  const theme = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState(transactionFilter.search);

  useEffect(() => {
    setSearch(transactionFilter.search);
  }, [transactionFilter.search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search === transactionFilter.search) {
        return;
      }
      setTransactionFilter({ search });
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, setTransactionFilter, transactionFilter.search]);

  const refreshing = useMemo(() => transactionsPagination.loading && transactions.length === 0, [
    transactionsPagination.loading,
    transactions.length,
  ]);

  useFocusEffect(
    useCallback(() => {
      reloadTransactions().catch((error) => console.error("Gagal memuat transaksi:", error));
    }, [reloadTransactions]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge">Transaksi</Text>
        <SegmentedButtons
          value={transactionFilter.period}
          onValueChange={(value) => setTransactionFilter({ period: value as typeof transactionFilter.period })}
          buttons={[
            { value: "this-month", label: "Bulan ini" },
            { value: "last-month", label: "Bulan lalu" },
            { value: "all", label: "Semua" },
          ]}
        />
      </View>

      <TextInput
        mode="outlined"
        placeholder="Cari transaksi (catatan atau kategori)"
        value={search}
        onChangeText={setSearch}
        left={<TextInput.Icon icon="magnify" />}
        style={styles.search}
      />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem
            note={item.note}
            amount={item.amount}
            type={item.type}
            date={item.date}
            categoryName={item.categoryName}
          />
        )}
        contentContainerStyle={styles.list}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (!transactionsPagination.hasMore || transactionsPagination.loading) {
            return;
          }
          loadMoreTransactions().catch((error) => {
            console.error("Gagal memuat transaksi tambahan:", error);
          });
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => reloadTransactions().catch((error) => console.error(error))}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>Tidak ada transaksi untuk periode ini.</Text>
          </View>
        }
        ListFooterComponent={
          transactionsPagination.loading && transactions.length > 0 ? (
            <ActivityIndicator animating style={styles.footerLoader} />
          ) : null
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push("/add-transaction")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    gap: 12,
    marginBottom: 12,
  },
  search: {
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingBottom: 80,
  },
  empty: {
    padding: 32,
    alignItems: "center",
  },
  footerLoader: {
    marginVertical: 16,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
  },
});
