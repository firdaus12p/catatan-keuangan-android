import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { InteractionManager } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Appbar, Card, Chip, ProgressBar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../context/AppContext";
import { ExpenseTypeManagerModal } from "../components/ExpenseTypeManagerModal";
import { ExpenseType } from "../db/database";
import { colors } from "../styles/commonStyles";
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
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
    getExpenseTypeTotalsByMonth,
    loadExpenseTypes,
    expenseTypes,
    initializeApp,
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "previous">(
    "current"
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [expenseTypeManagerVisible, setExpenseTypeManagerVisible] =
    useState(false);
  const [expenseTypeBreakdown, setExpenseTypeBreakdown] = useState<
    ExpenseType[]
  >([]);

  const resolvePeriodDate = useCallback((period: "current" | "previous") => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (period === "current") {
      return { month: currentMonth, year: currentYear };
    }

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return { month: prevMonth, year: prevYear };
  }, []);

  const refreshExpenseBreakdown = useCallback(
    async (period: "current" | "previous") => {
      const { month, year } = resolvePeriodDate(period);
      const breakdown = await getExpenseTypeTotalsByMonth(year, month);
      setExpenseTypeBreakdown(breakdown);
    },
    [getExpenseTypeTotalsByMonth, resolvePeriodDate]
  );

  // Initialize app dan load data
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const initApp = async () => {
        if (cancelled) return;
        if (!isInitialized) {
          await initializeApp();
          setIsInitialized(true);
        } else {
          await loadCategories();
          await loadExpenseTypes();

          const target = resolvePeriodDate(selectedPeriod);
          await loadMonthlyStats(target.year, target.month);
        }

        await refreshExpenseBreakdown(selectedPeriod);
      };

      const interaction = InteractionManager.runAfterInteractions(() => {
        void initApp();
      });

      return () => {
        cancelled = true;
        if (interaction && typeof interaction.cancel === "function") {
          interaction.cancel();
        }
      };
    }, [
      initializeApp,
      isInitialized,
      loadCategories,
      loadExpenseTypes,
      loadMonthlyStats,
      refreshExpenseBreakdown,
      resolvePeriodDate,
      selectedPeriod,
    ])
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

  // Hitung total persentase alokasi dari semua kategori
  const totalAllocationPercentage = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.percentage, 0);
  }, [categories]);

  const totalExpenseTypeSpent = useMemo(
    () =>
      expenseTypeBreakdown.reduce(
        (sum, type) => sum + (type.total_spent ?? 0),
        0
      ),
    [expenseTypeBreakdown]
  );

  const sortedExpenseTypes = useMemo(
    () =>
      [...expenseTypeBreakdown].sort(
        (a, b) => (b.total_spent ?? 0) - (a.total_spent ?? 0)
      ),
    [expenseTypeBreakdown]
  );

  // Validasi total alokasi sebelum membuka halaman transaksi
  const validateAllocation = useCallback(() => {
    if (totalAllocationPercentage < 100) {
      Alert.alert(
        "Alokasi Belum Lengkap",
        `Total alokasi kategori saat ini ${totalAllocationPercentage.toFixed(
          1
        )}%.\n\nAnda perlu melengkapi alokasi hingga 100% sebelum dapat menginput transaksi.\n\nSilakan pergi ke halaman Kategori untuk menambah kategori atau mengatur ulang persentase alokasi.`,
        [
          {
            text: "OK",
            style: "default",
          },
          {
            text: "Ke Halaman Kategori",
            onPress: () => router.push({ pathname: "/(tabs)/category" } as any),
          },
        ]
      );
      return false;
    }
    return true;
  }, [totalAllocationPercentage, router]);

  const openExpenseTypeManager = useCallback(() => {
    setExpenseTypeManagerVisible(true);
  }, []);

  const closeExpenseTypeManager = useCallback(() => {
    setExpenseTypeManagerVisible(false);
  }, []);

  const handleCreateExpenseType = useCallback(
    async (name: string) => {
      await addExpenseType(name);
      await refreshExpenseBreakdown(selectedPeriod);
    },
    [addExpenseType, refreshExpenseBreakdown, selectedPeriod]
  );

  const handleUpdateExpenseType = useCallback(
    async (id: number, name: string) => {
      await updateExpenseType(id, name);
      await refreshExpenseBreakdown(selectedPeriod);
    },
    [refreshExpenseBreakdown, selectedPeriod, updateExpenseType]
  );

  const handleDeleteExpenseType = useCallback(
    async (id: number) => {
      await deleteExpenseType(id);
      await refreshExpenseBreakdown(selectedPeriod);
    },
    [deleteExpenseType, refreshExpenseBreakdown, selectedPeriod]
  );

  const handleTransactionNavigation = useCallback(
    (type: "income" | "expense") => {
      if (!validateAllocation()) {
        return;
      }

      router.push({
        pathname: "/(tabs)/transaction",
        params: { action: type },
      } as any);
    },
    [validateAllocation, router]
  );

  const handlePeriodChange = useCallback(
    async (period: "current" | "previous") => {
      setSelectedPeriod(period);
      const target = resolvePeriodDate(period);
      await loadMonthlyStats(target.year, target.month);
      await refreshExpenseBreakdown(period);
    },
    [loadMonthlyStats, refreshExpenseBreakdown, resolvePeriodDate]
  );

  // Data untuk chart
  const { month, year } = getCurrentMonthYear();
  const currentMonthName = getMonthName(month);
  const previousMonthName = getMonthName(month === 1 ? 12 : month - 1);

  // Optimasi perhitungan dengan useMemo
  const { totalBalance, categoriesWithBalance } = useMemo(() => {
    const balance = categories.reduce((sum, cat) => sum + cat.balance, 0);
    const withBalance = categories.filter((cat) => cat.balance > 0);
    return { totalBalance: balance, categoriesWithBalance: withBalance };
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

  const renderQuickActions = () => (
    <Card style={styles.quickActionsCard} elevation={2}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: "#E8F5E8" }]}
            onPress={() => handleTransactionNavigation("income")}
          >
            <MaterialIcons name="trending-up" size={32} color="#4CAF50" />
            <Text style={styles.quickActionText}>Tambah{"\n"}Pemasukan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: "#FFEBEE" }]}
            onPress={() => handleTransactionNavigation("expense")}
          >
            <MaterialIcons name="trending-down" size={32} color="#F44336" />
            <Text style={styles.quickActionText}>Tambah{"\n"}Pengeluaran</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: "#E3F2FD" }]}
            onPress={() => router.push({ pathname: "/(tabs)/category" } as any)}
          >
            <MaterialIcons name="category" size={32} color="#2196F3" />
            <Text style={styles.quickActionText}>Kelola{"\n"}Kategori</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: "#FFF3E0" }]}
            onPress={() => router.push({ pathname: "/(tabs)/loan" } as any)}
          >
            <MaterialIcons name="handshake" size={32} color="#FF9800" />
            <Text style={styles.quickActionText}>Kelola{"\n"}Pinjaman</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: "#FFEBEE" }]}
            onPress={() => router.push("/reset" as any)}
          >
            <MaterialIcons name="refresh" size={32} color="#F44336" />
            <Text style={styles.quickActionText}>Reset{"\n"}Data</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

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

      {/* Expense Type Highlight */}
      <Card style={styles.expenseHighlightCard} elevation={2}>
        <Card.Content>
          <View style={styles.expenseHighlightHeader}>
            <Text style={styles.expenseHighlightTitle}>
              Pengeluaran Terbanyak
            </Text>
            <TouchableOpacity
              onPress={openExpenseTypeManager}
              style={styles.expenseHighlightSettings}
            >
              <MaterialIcons
                name="settings"
                size={20}
                color={colors.expense}
              />
            </TouchableOpacity>
          </View>
          {totalExpenseTypeSpent > 0 ? (
            <View style={styles.expenseListContainer}>
              <Text style={styles.expenseSummaryTotal}>
                Total: {formatCurrency(totalExpenseTypeSpent)}
              </Text>
              {sortedExpenseTypes.map((type) => {
                const amount = type.total_spent ?? 0;
                const percentage =
                  totalExpenseTypeSpent > 0 ? amount / totalExpenseTypeSpent : 0;

                return (
                  <View key={type.id} style={styles.expenseListRow}>
                    <View style={styles.expenseListItem}>
                      <View style={styles.expenseListInfo}>
                        <Text style={styles.expenseListName}>{type.name}</Text>
                        <Text style={styles.expenseListAmount}>
                          {formatCurrency(amount)}
                        </Text>
                      </View>
                      <Text style={styles.expenseListPercentage}>
                        {(percentage * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <ProgressBar
                      progress={Math.min(Math.max(percentage, 0), 1)}
                      color={colors.expense}
                      style={styles.expenseListProgress}
                    />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.expenseHighlightEmpty}>
              <MaterialIcons name="insights" size={48} color="#CCCCCC" />
              <Text style={styles.emptyChartText}>
                Belum ada data pengeluaran
              </Text>
              <Text style={styles.expenseHighlightDescription}>
                Tambahkan transaksi pengeluaran untuk melihat jenis
                yang paling mendominasi.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="💸 Kemenku"
          subtitle="Aplikasi Catatan Keuangan"
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
        />
        <Appbar.Action
          icon="cog"
          iconColor="#FFFFFF"
          onPress={() => router.push("/reset" as any)}
          style={{ marginTop: -20 }}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderFinancialSummary()}
        {renderCategoryBalances()}
        {renderCharts()}
      </ScrollView>

      <ExpenseTypeManagerModal
        visible={expenseTypeManagerVisible}
        onDismiss={closeExpenseTypeManager}
        expenseTypes={expenseTypes}
        onCreate={handleCreateExpenseType}
        onUpdate={handleUpdateExpenseType}
        onDelete={handleDeleteExpenseType}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: colors.home,
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
    paddingBottom: 75,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.home,
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
  expenseHighlightCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  expenseHighlightHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  expenseHighlightTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.home,
  },
  expenseHighlightSettings: {
    padding: 4,
  },
  expenseListContainer: {
    marginTop: 4,
  },
  expenseSummaryTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  expenseListRow: {
    marginTop: 4,
  },
  expenseListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  expenseListInfo: {
    flex: 1,
  },
  expenseListName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  expenseListAmount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expenseListPercentage: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.expense,
    marginLeft: 12,
  },
  expenseListProgress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFCDD2",
  },
  expenseHighlightEmpty: {
    alignItems: "center",
    paddingVertical: 12,
  },
  expenseHighlightDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
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
  },
});
