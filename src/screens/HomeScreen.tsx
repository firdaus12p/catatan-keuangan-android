import { useCallback, useMemo, useState } from "react";
import { Dimensions, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Button,
  Card,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";
import { BarChart } from "react-native-chart-kit";

import { CategoryCard } from "@/src/components/CategoryCard";
import { ChartCard } from "@/src/components/ChartCard";
import { useAppContext } from "@/src/context/AppContext";
import { formatCurrency } from "@/src/utils/formatCurrency";

const chartConfig = {
  backgroundColor: "#F4F9FB",
  backgroundGradientFrom: "#F4F9FB",
  backgroundGradientTo: "#F4F9FB",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 175, 218, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(90, 105, 120, ${opacity})`,
  fillShadowGradientOpacity: 1,
  propsForBackgroundLines: {
    stroke: "#E0F3FF",
  },
  barPercentage: 0.6,
};

export default function HomeScreen() {
  const {
    transactionSummary,
    categoryAggregates,
    transactionFilter,
    setTransactionFilter,
    refreshAll,
  } = useAppContext();
  const theme = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll]);

  const barData = useMemo(
    () => ({
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [
        {
          data: [transactionSummary.income, transactionSummary.expense],
        },
      ],
    }),
    [transactionSummary.expense, transactionSummary.income],
  );

  const topCategories = useMemo(
    () =>
      [...categoryAggregates]
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 3),
    [categoryAggregates],
  );

  const chartWidth = Dimensions.get("window").width - 48;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text variant="displaySmall">CatatKu</Text>
          <Text style={{ color: theme.colors.outline }}>Ringkasan keuangan pribadi</Text>
        </View>
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

      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.secondary }]} mode="elevated">
          <Card.Title title="Total Masuk" titleStyle={styles.summaryTitle} />
          <Card.Content>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {formatCurrency(transactionSummary.income)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={[styles.summaryCard, { backgroundColor: theme.colors.tertiary }]} mode="elevated">
          <Card.Title title="Total Keluar" titleStyle={styles.summaryTitle} />
          <Card.Content>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {formatCurrency(transactionSummary.expense)}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <ChartCard title="Grafik Pemasukan vs Pengeluaran">
        <BarChart
          data={barData}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          yAxisLabel=""
          yAxisSuffix=""
          style={styles.chart}
        />
      </ChartCard>

      <View style={styles.quickActions}>
        <Button
          mode="contained"
          icon="plus-circle"
          onPress={() => router.push("/add-transaction")}
          style={styles.actionButton}
        >
          Transaksi
        </Button>
        <Button
          mode="outlined"
          icon="shape"
          onPress={() => router.push("/(tabs)/categories")}
          style={styles.actionButton}
        >
          Kategori
        </Button>
        <Button
          mode="outlined"
          icon="handshake-outline"
          onPress={() => router.push("/(tabs)/loans")}
          style={styles.actionButton}
        >
          Pinjaman
        </Button>
      </View>

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge">Kategori Teratas</Text>
        <Text style={{ color: theme.colors.outline }}>Saldo tertinggi saat ini</Text>
      </View>
      <View style={styles.categoryList}>
        {topCategories.map((category) => (
          <CategoryCard
            key={category.categoryId}
            category={{
              id: category.categoryId,
              name: category.categoryName,
              percentage: category.percentage,
              balance: category.balance,
            }}
          />
        ))}
        {topCategories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text>Belum ada data kategori untuk periode ini.</Text>
            </Card.Content>
          </Card>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
  },
  summaryTitle: {
    color: "#0F172A",
  },
  summaryValue: {
    color: "#0F172A",
  },
  chart: {
    borderRadius: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  categoryList: {
    gap: 12,
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
});
