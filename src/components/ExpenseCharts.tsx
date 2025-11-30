import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  InteractionManager,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "react-native-paper";
import { Category } from "../db/database";
import { colors } from "../styles/commonStyles";
import { CHART, CHART_COLORS } from "../utils/constants";

const screenWidth = Dimensions.get("window").width;

// ✅ OPTIMIZATION: Dynamic import untuk PieChart (lazy loading)
// react-native-chart-kit adalah library berat (~200KB), jadi kita load on-demand
let PieChartComponent: any = null;

interface ExpenseChartsProps {
  categories: Category[];
}

// ✅ OPTIMIZATION: Memoized PieChart wrapper dengan dynamic component
const MemoizedPieChart = React.memo(
  ({ PieChart: Chart, ...props }: any) => {
    if (!Chart) return null;
    return <Chart {...props} />;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data.length === nextProps.data.length &&
      prevProps.data.every(
        (item: any, index: number) =>
          item.population === nextProps.data[index].population
      )
    );
  }
);

export const ExpenseCharts = React.memo<ExpenseChartsProps>(
  ({ categories }) => {
    // ✅ OPTIMIZATION: State untuk track loading chart library
    const [isChartReady, setIsChartReady] = useState(false);

    // ✅ OPTIMIZATION: Dynamic import PieChart setelah UI interactive
    useEffect(() => {
      const loadChartLibrary = async () => {
        // Defer loading sampai UI idle (tidak blocking render)
        const task = InteractionManager.runAfterInteractions(async () => {
          try {
            // Dynamic import react-native-chart-kit
            const chartKit = await import("react-native-chart-kit");
            PieChartComponent = chartKit.PieChart;
            setIsChartReady(true);
          } catch (error) {
            console.warn("Failed to load chart library:", error);
          }
        });

        return () => task.cancel();
      };

      loadChartLibrary();
    }, []);

    const chartConfig = {
      backgroundColor: "#FFFFFF",
      backgroundGradientFrom: "#FFFFFF",
      backgroundGradientTo: "#FFFFFF",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
      style: {
        borderRadius: 16,
      },
    };

    // Data untuk Category Balance Chart dengan memoization
    const categoriesWithBalance = useMemo(
      () => categories.filter((cat) => cat.balance > 0),
      [categories]
    );

    const categoryBalanceData = useMemo(
      () =>
        categoriesWithBalance.length > 0
          ? categoriesWithBalance.map((cat, index) => ({
              name:
                cat.name.length > 10
                  ? cat.name.substring(0, 8) + "..."
                  : cat.name,
              population: cat.balance,
              color: `hsl(${
                (index * CHART_COLORS.HSL_HUE_STEP) % CHART_COLORS.HSL_MAX_HUE
              }, ${CHART_COLORS.HSL_SATURATION}%, ${
                CHART_COLORS.HSL_LIGHTNESS
              }%)`,
              legendFontColor: "#333333",
              legendFontSize: 12,
            }))
          : [
              {
                name: "Tidak ada data",
                population: 1,
                color: "#CCCCCC",
                legendFontColor: "#999999",
                legendFontSize: 12,
              },
            ],
      [categoriesWithBalance]
    );

    return (
      <Card style={styles.chartCard} elevation={2}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Distribusi Saldo Kategori</Text>
          <View style={styles.chartContainer}>
            {!isChartReady ? (
              // ✅ OPTIMIZATION: Lightweight loading placeholder
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.home} />
                <Text style={styles.loadingText}>Memuat grafik...</Text>
              </View>
            ) : categoriesWithBalance.length > 0 ? (
              <MemoizedPieChart
                PieChart={PieChartComponent}
                data={categoryBalanceData}
                width={screenWidth - 10}
                height={CHART.DEFAULT_HEIGHT}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="5"
                center={[20, 0]}
                style={styles.chart}
              />
            ) : (
              <View style={styles.emptyChartContainer}>
                <MaterialIcons name="pie-chart" size={48} color="#CCCCCC" />
                <Text style={styles.emptyChartText}>
                  Data keuangan belum ada
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison untuk mencegah re-render tidak perlu
    return (
      prevProps.categories.length === nextProps.categories.length &&
      prevProps.categories.every(
        (cat, idx) => cat.balance === nextProps.categories[idx].balance
      )
    );
  }
);

ExpenseCharts.displayName = "ExpenseCharts";

const styles = StyleSheet.create({
  chartCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.home,
    marginBottom: 16,
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyChartContainer: {
    height: CHART.DEFAULT_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
  // ✅ OPTIMIZATION: Loading placeholder styles
  loadingContainer: {
    height: CHART.DEFAULT_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.home,
    fontStyle: "italic",
  },
});
