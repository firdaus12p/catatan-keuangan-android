import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Appbar, Card, Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { database } from "../db/database";
import { getCurrentMonthYear, getMonthName } from "../utils/dateHelper";
import { formatCurrency } from "../utils/formatCurrency";

const screenWidth = Dimensions.get("window").width;

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const {
    categories,
    monthlyStats,
    loadCategories,
    loadMonthlyStats,
    initializeApp,
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "previous">(
    "current"
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [expenseStats, setExpenseStats] = useState<
    { name: string; total: number; count: number }[]
  >([]);

  // Initialize app dan load data
  useFocusEffect(
    React.useCallback(() => {
      const initApp = async () => {
        if (!isInitialized) {
          await initializeApp();
          setIsInitialized(true);
        } else {
          await loadCategories();

          // Load stats berdasarkan periode yang dipilih
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();

          if (selectedPeriod === "current") {
            await loadMonthlyStats(currentYear, currentMonth);
            await loadExpenseStats(currentYear, currentMonth);
          } else {
            const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
            await loadMonthlyStats(prevYear, prevMonth);
            await loadExpenseStats(prevYear, prevMonth);
          }
        }
      };

      initApp();
    }, [selectedPeriod, isInitialized])
  );

  // Auto-select top 2 categories with highest balance as default
  useFocusEffect(
    React.useCallback(() => {
      if (categories.length > 0 && selectedCategoryIds.length === 0) {
        const topCategories = categories
          .filter((cat) => cat.balance > 0 && cat.id)
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 2)
          .map((cat) => cat.id!);

        setSelectedCategoryIds(topCategories);
      }
    }, [categories])
  );

  const handlePeriodChange = async (period: "current" | "previous") => {
    setSelectedPeriod(period);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (period === "current") {
      await loadMonthlyStats(currentYear, currentMonth);
      await loadExpenseStats(currentYear, currentMonth);
    } else {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      await loadMonthlyStats(prevYear, prevMonth);
      await loadExpenseStats(prevYear, prevMonth);
    }
  };

  const loadExpenseStats = async (year: number, month: number) => {
    try {
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;
      const stats = await database.getExpenseStatsByType(startDate, endDate);
      const filteredStats = stats.filter((stat) => stat.total > 0).slice(0, 5);
      setExpenseStats(filteredStats);
    } catch (error) {
      console.error("Error loading expense stats:", error);
    }
  };

  // Data untuk chart
  const { month, year } = getCurrentMonthYear();
  const currentMonthName = getMonthName(month);
  const previousMonthName = getMonthName(month === 1 ? 12 : month - 1);

  // Optimasi perhitungan dengan useMemo
  const { categoriesWithBalance } = useMemo(() => {
    const withBalance = categories.filter((cat) => cat.balance > 0);
    return { categoriesWithBalance: withBalance };
  }, [categories]);

  // Gunakan saldo bersih dari monthlyStats yang sudah dihitung dengan benar
  const saldoBersih = monthlyStats.saldoBersih;

  // Data untuk Income vs Expense Chart dengan memoization
  const incomeExpenseData = useMemo(
    () => ({
      labels: ["Pemasukan", "Pengeluaran"],
      datasets: [
        {
          data: [monthlyStats.totalIncome || 1, monthlyStats.totalExpense || 1],
          colors: [
            (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Hijau untuk Pemasukan
            (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Merah untuk Pengeluaran
          ],
        },
      ],
    }),
    [monthlyStats.totalIncome, monthlyStats.totalExpense]
  );

  // Data untuk Category Balance Chart dengan memoization
  const categoryBalanceData = useMemo(
    () =>
      categoriesWithBalance.length > 0
        ? categoriesWithBalance.map((cat, index) => ({
            name:
              cat.name.length > 10
                ? cat.name.substring(0, 8) + "..."
                : cat.name,
            population: cat.balance,
            color: `hsl(${(index * 60) % 360}, 50%, 50%)`,
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

  // Helper functions untuk kategori selector dengan useCallback
  const handleCategoryToggle = useCallback((categoryId: number) => {
    setSelectedCategoryIds((prev) => {
      const isSelected = prev.includes(categoryId);
      if (isSelected) {
        return prev.filter((id) => id !== categoryId);
      } else if (prev.length < 2) {
        return [...prev, categoryId];
      }
      return prev;
    });
  }, []);

  const getSelectedCategories = useCallback(() => {
    return categories.filter(
      (cat) => cat.id && selectedCategoryIds.includes(cat.id)
    );
  }, [categories, selectedCategoryIds]);

  const renderFinancialSummary = () => (
    <Card style={styles.summaryCard} elevation={2}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Ringkasan Keuangan</Text>

        {/* Period Filter */}
        <View style={styles.periodFilter}>
          <Chip
            selected={selectedPeriod === "current"}
            onPress={() => handlePeriodChange("current")}
            style={styles.periodChip}
          >
            {currentMonthName} {year}
          </Chip>
          <Chip
            selected={selectedPeriod === "previous"}
            onPress={() => handlePeriodChange("previous")}
            style={styles.periodChip}
          >
            {previousMonthName}
          </Chip>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialIcons
              name="account-balance-wallet"
              size={24}
              color="#2196F3"
            />
            <Text style={styles.statLabel}>Total Saldo</Text>
            <Text style={styles.statValue}>
              {formatCurrency(monthlyStats.totalSaldo)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.statLabel}>Pemasukan</Text>
            <Text style={[styles.statValue, { color: "#4CAF50" }]}>
              {formatCurrency(monthlyStats.totalIncome)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <MaterialIcons name="trending-down" size={24} color="#F44336" />
            <Text style={styles.statLabel}>Pengeluaran</Text>
            <Text style={[styles.statValue, { color: "#F44336" }]}>
              {formatCurrency(monthlyStats.totalExpense)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <MaterialIcons
              name={saldoBersih >= 0 ? "savings" : "warning"}
              size={24}
              color={saldoBersih >= 0 ? "#4CAF50" : "#F44336"}
            />
            <Text style={styles.statLabel}>Saldo Bersih</Text>
            <Text
              style={[
                styles.statValue,
                { color: saldoBersih >= 0 ? "#4CAF50" : "#F44336" },
              ]}
            >
              {formatCurrency(saldoBersih)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCategoryBalances = () => {
    const selectedCategories = getSelectedCategories();

    return (
      <Card style={styles.summaryCard} elevation={2}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saldo Kategori</Text>
            <TouchableOpacity
              onPress={() => setShowCategorySelector(!showCategorySelector)}
              style={styles.settingsButton}
            >
              <MaterialIcons
                name={showCategorySelector ? "expand-less" : "settings"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Category Selector */}
          {showCategorySelector && (
            <View style={styles.categorySelector}>
              <Text style={styles.selectorLabel}>
                Pilih maksimal 2 kategori:
              </Text>
              <View style={styles.categoryChips}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    selected={
                      category.id
                        ? selectedCategoryIds.includes(category.id)
                        : false
                    }
                    onPress={() =>
                      category.id && handleCategoryToggle(category.id)
                    }
                    style={styles.categoryChip}
                    disabled={
                      !selectedCategoryIds.includes(category.id || 0) &&
                      selectedCategoryIds.length >= 2
                    }
                  >
                    {category.name}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {/* Selected Categories Display */}
          {selectedCategories.length > 0 ? (
            <View>
              {/* Total Gabungan */}
              {selectedCategories.length === 2 && (
                <View style={styles.totalCombinedCard}>
                  <MaterialIcons name="functions" size={24} color="#2196F3" />
                  <Text style={styles.totalCombinedLabel}>Total Gabungan</Text>
                  <Text style={styles.totalCombinedValue}>
                    {formatCurrency(
                      selectedCategories.reduce(
                        (sum, cat) => sum + cat.balance,
                        0
                      )
                    )}
                  </Text>
                </View>
              )}

              {/* Individual Categories */}
              <View style={styles.selectedCategoriesGrid}>
                {selectedCategories.map((category) => (
                  <View key={category.id} style={styles.categoryBalanceItem}>
                    <MaterialIcons
                      name="account-balance-wallet"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.categoryBalanceLabel} numberOfLines={1}>
                      {category.name}
                    </Text>
                    <Text style={styles.categoryBalanceValue}>
                      {formatCurrency(category.balance)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="info" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>
                Pilih kategori untuk melihat saldo
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Tekan ikon pengaturan di atas untuk memilih kategori
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderCharts = () => (
    <View>
      {/* Income vs Expense Chart */}
      <Card style={styles.chartCard} elevation={2}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Pemasukan & Pengeluaran</Text>
          <View style={styles.chartContainer}>
            {monthlyStats.totalIncome > 0 || monthlyStats.totalExpense > 0 ? (
              <BarChart
                data={incomeExpenseData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero={true}
                showValuesOnTopOfBars={true}
              />
            ) : (
              <View style={styles.emptyChartContainer}>
                <MaterialIcons name="bar-chart" size={48} color="#CCCCCC" />
                <Text style={styles.emptyChartText}>
                  Data keuangan belum ada
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Category Balance Chart */}
      <Card style={styles.chartCard} elevation={2}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Distribusi Saldo Kategori</Text>
          <View style={styles.chartContainer}>
            {categoriesWithBalance.length > 0 ? (
              <PieChart
                data={categoryBalanceData}
                width={screenWidth - 10}
                height={200}
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
    </View>
  );

  const renderExpenseAnalytics = () => {
    const totalExpense = expenseStats.reduce(
      (sum, stat) => sum + stat.total,
      0
    );

    return (
      <Card style={styles.summaryCard} elevation={2}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialIcons name="analytics" size={24} color="#673AB7" />
            <Text style={styles.sectionTitle}>Analisis Pengeluaran</Text>
          </View>

          <Text style={styles.cardSubtitle}>
            {selectedPeriod === "current" ? "Bulan Ini" : "Bulan Lalu"}
          </Text>

          <View style={styles.totalExpenseContainer}>
            <Text style={styles.totalExpenseLabel}>Total Pengeluaran</Text>
            <Text style={styles.totalExpenseAmount}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>

          {expenseStats.length > 0 ? (
            <View style={styles.expenseStatsContainer}>
              {expenseStats.slice(0, 3).map((stat, index) => (
                <View key={index} style={styles.expenseStatItem}>
                  <View style={styles.expenseStatLeft}>
                    <Text style={styles.expenseStatName}>{stat.name}</Text>
                    <Text style={styles.expenseStatCount}>
                      {stat.count} transaksi
                    </Text>
                  </View>
                  <View style={styles.expenseStatRight}>
                    <Text style={styles.expenseStatAmount}>
                      {formatCurrency(stat.total)}
                    </Text>
                    <Text style={styles.expenseStatPercentage}>
                      {totalExpense > 0
                        ? ((stat.total / totalExpense) * 100).toFixed(1)
                        : "0"}
                      %
                    </Text>
                  </View>
                </View>
              ))}

              {expenseStats.length > 3 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => {
                    // Navigate to full analytics - could be implemented as modal or new screen
                  }}
                >
                  <Text style={styles.viewMoreText}>
                    Lihat {expenseStats.length - 3} lainnya →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyExpenseContainer}>
              <MaterialIcons name="receipt" size={48} color="#CCCCCC" />
              <Text style={styles.emptyExpenseText}>
                Belum ada data pengeluaran
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="💸 CatatKu"
          subtitle="Aplikasi Catatan Keuangan"
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
        />
        <Appbar.Action
          icon="bell"
          iconColor="#FFFFFF"
          onPress={() => router.push("/notification" as any)}
          style={{ marginTop: -23 }}
        />
        <Appbar.Action
          icon="cog"
          iconColor="#FFFFFF"
          onPress={() => router.push("/settings" as any)}
          style={{ marginTop: -23 }}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderFinancialSummary()}
        {renderCategoryBalances()}
        {renderExpenseAnalytics()}
        {renderCharts()}
      </ScrollView>
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
    height: 20,
    minHeight: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: -25,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#E3F2FD",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Increased for better spacing
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 16,
    textAlign: "center",
  },
  quickActionsCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333333",
    textAlign: "center",
    marginTop: 8,
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  periodFilter: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  periodChip: {
    backgroundColor: "#F5F5F5",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "47%",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 4,
    textAlign: "center",
  },
  chartCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
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
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
  // Category Balances Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  settingsButton: {
    padding: 4,
  },
  categorySelector: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  selectorLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  categoryChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  totalCombinedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    marginBottom: 12,
  },
  totalCombinedLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginLeft: 8,
    flex: 1,
  },
  totalCombinedValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1565C0",
  },
  selectedCategoriesGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  categoryBalanceItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    minHeight: 80,
  },
  categoryBalanceLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginBottom: 4,
    textAlign: "center",
  },
  categoryBalanceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#CCC",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  totalExpenseContainer: {
    backgroundColor: "#F3E5F5",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: "center",
  },
  totalExpenseLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  totalExpenseAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#673AB7",
  },
  expenseStatsContainer: {
    marginTop: 8,
  },
  expenseStatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  expenseStatLeft: {
    flex: 1,
  },
  expenseStatName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  expenseStatCount: {
    fontSize: 12,
    color: "#666",
  },
  expenseStatRight: {
    alignItems: "flex-end",
  },
  expenseStatAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#673AB7",
    marginBottom: 2,
  },
  expenseStatPercentage: {
    fontSize: 12,
    color: "#999",
  },
  viewMoreButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 14,
    color: "#673AB7",
    fontWeight: "500",
  },
  emptyExpenseContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyExpenseText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
});
