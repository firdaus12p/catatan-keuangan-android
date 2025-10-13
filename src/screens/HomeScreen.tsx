import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
          } else {
            const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
            await loadMonthlyStats(prevYear, prevMonth);
          }
        }
      };

      initApp();
    }, [selectedPeriod, isInitialized])
  );

  const handlePeriodChange = async (period: "current" | "previous") => {
    setSelectedPeriod(period);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (period === "current") {
      await loadMonthlyStats(currentYear, currentMonth);
    } else {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      await loadMonthlyStats(prevYear, prevMonth);
    }
  };

  // Data untuk chart
  const { month, year } = getCurrentMonthYear();
  const currentMonthName = getMonthName(month);
  const previousMonthName = getMonthName(month === 1 ? 12 : month - 1);

  // Hitung total saldo dari semua kategori
  const totalBalance = categories.reduce((sum, cat) => sum + cat.balance, 0);
  const netBalance = monthlyStats.totalIncome - monthlyStats.totalExpense;

  // Data untuk Income vs Expense Chart
  const incomeExpenseData = {
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
  };

  // Data untuk Category Balance Chart (hanya kategori dengan saldo > 0)
  const categoriesWithBalance = categories.filter((cat) => cat.balance > 0);
  const categoryBalanceData =
    categoriesWithBalance.length > 0
      ? categoriesWithBalance.map((cat, index) => ({
          name:
            cat.name.length > 10 ? cat.name.substring(0, 8) + "..." : cat.name,
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
        ];

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

  const renderQuickActions = () => (
    <Card style={styles.quickActionsCard} elevation={2}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: "#E8F5E8" }]}
            onPress={() =>
              router.push({ pathname: "/(tabs)/transaction" } as any)
            }
          >
            <MaterialIcons name="trending-up" size={32} color="#4CAF50" />
            <Text style={styles.quickActionText}>Tambah{"\n"}Pemasukan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionItem, { backgroundColor: "#FFEBEE" }]}
            onPress={() =>
              router.push({ pathname: "/(tabs)/transaction" } as any)
            }
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
            <Text style={styles.statValue}>{formatCurrency(totalBalance)}</Text>
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
              name={netBalance >= 0 ? "savings" : "warning"}
              size={24}
              color={netBalance >= 0 ? "#4CAF50" : "#F44336"}
            />
            <Text style={styles.statLabel}>Saldo Bersih</Text>
            <Text
              style={[
                styles.statValue,
                { color: netBalance >= 0 ? "#4CAF50" : "#F44336" },
              ]}
            >
              {formatCurrency(netBalance)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCharts = () => (
    <View>
      {/* Income vs Expense Chart */}
      {(monthlyStats.totalIncome > 0 || monthlyStats.totalExpense > 0) && (
        <Card style={styles.chartCard} elevation={2}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Pemasukan & Pengeluaran</Text>
            <View style={styles.chartContainer}>
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
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Category Balance Chart */}
      {categoriesWithBalance.length > 0 && (
        <Card style={styles.chartCard} elevation={2}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Distribusi Saldo Kategori</Text>
            <View style={styles.chartContainer}>
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
            </View>
          </Card.Content>
        </Card>
      )}
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
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderQuickActions()}
        {renderFinancialSummary()}
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
    paddingBottom: 75,
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
    width: "47%",
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
});
