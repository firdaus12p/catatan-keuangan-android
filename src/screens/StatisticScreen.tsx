import { useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import {
  DataTable,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";
import { PieChart, StackedBarChart } from "react-native-chart-kit";

import { useAppContext } from "@/src/context/AppContext";

const palette = ["#3BAFDA", "#57CC99", "#F6B4A5", "#FFD166", "#A78BFA", "#EF8354"];

const chartConfig = {
  backgroundColor: "#F4F9FB",
  backgroundGradientFrom: "#F4F9FB",
  backgroundGradientTo: "#F4F9FB",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(90, 105, 120, ${opacity})`,
  propsForBackgroundLines: {
    stroke: "#E0F3FF",
  },
};

export default function StatisticScreen() {
  const { categoryAggregates, transactionSummary, transactionFilter, setTransactionFilter } =
    useAppContext();
  const theme = useTheme();
  const chartWidth = Dimensions.get("window").width - 48;

  const pieData = useMemo(
    () =>
      categoryAggregates.length > 0
        ? categoryAggregates.map((item, index) => ({
            name: item.categoryName,
            population: item.balance <= 0 ? 0.001 : item.balance,
            color: palette[index % palette.length],
            legendFontColor: theme.colors.onSurface,
            legendFontSize: 12,
          }))
        : [],
    [categoryAggregates, theme.colors.onSurface],
  );

  const barData = useMemo(
    () => ({
      labels: categoryAggregates.map((item) => item.categoryName.split(" ")[0]),
      legend: ["Pemasukan", "Pengeluaran"],
      data: categoryAggregates.map((item) => [item.income, item.expense]),
      barColors: [theme.colors.primary, theme.colors.tertiary],
    }),
    [categoryAggregates, theme.colors.primary, theme.colors.tertiary],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge">Statistik & Analisis</Text>
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

      <View style={styles.summary}>
        <Text variant="bodyLarge">
          Total pemasukan:{" "}
          <Text style={{ color: theme.colors.secondary }}>
            Rp {transactionSummary.income.toLocaleString("id-ID")}
          </Text>
        </Text>
        <Text variant="bodyLarge">
          Total pengeluaran:{" "}
          <Text style={{ color: theme.colors.tertiary }}>
            Rp {transactionSummary.expense.toLocaleString("id-ID")}
          </Text>
        </Text>
      </View>

      <View style={styles.chartSection}>
        <Text variant="titleMedium">Proporsi Saldo Kategori</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={chartWidth}
            height={240}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="16"
            absolute
          />
        ) : (
          <Text>Tidak ada data saldo kategori untuk ditampilkan.</Text>
        )}
      </View>

      <View style={styles.chartSection}>
        <Text variant="titleMedium">Perbandingan Pemasukan & Pengeluaran</Text>
        {categoryAggregates.length > 0 ? (
          <StackedBarChart
            data={barData}
            width={chartWidth}
            height={260}
            chartConfig={chartConfig}
            style={styles.stackedChart}
            yAxisLabel=""
            yAxisSuffix=""
            hideLegend={false}
            decimalPlaces={0}
          />
        ) : (
          <Text>Belum ada transaksi pada periode ini.</Text>
        )}
      </View>

      <DataTable style={styles.table}>
        <DataTable.Header>
          <DataTable.Title>Kategori</DataTable.Title>
          <DataTable.Title numeric>Pemasukan</DataTable.Title>
          <DataTable.Title numeric>Pengeluaran</DataTable.Title>
          <DataTable.Title numeric>Saldo</DataTable.Title>
        </DataTable.Header>
        {categoryAggregates.map((item) => (
          <DataTable.Row key={item.categoryId}>
            <DataTable.Cell>{item.categoryName}</DataTable.Cell>
            <DataTable.Cell numeric>Rp {item.income.toLocaleString("id-ID")}</DataTable.Cell>
            <DataTable.Cell numeric>Rp {item.expense.toLocaleString("id-ID")}</DataTable.Cell>
            <DataTable.Cell numeric>Rp {item.balance.toLocaleString("id-ID")}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
    paddingBottom: 32,
  },
  header: {
    gap: 12,
  },
  summary: {
    gap: 4,
  },
  chartSection: {
    gap: 12,
  },
  stackedChart: {
    borderRadius: 16,
  },
  table: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
});
