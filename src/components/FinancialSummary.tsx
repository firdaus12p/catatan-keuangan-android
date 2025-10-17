import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, Chip } from "react-native-paper";
import { colors } from "../styles/commonStyles";
import { formatCurrency } from "../utils/formatCurrency";

interface FinancialSummaryProps {
  currentMonthName: string;
  previousMonthName: string;
  year: number;
  selectedPeriod: "current" | "previous";
  totalSaldo: number;
  totalIncome: number;
  totalExpense: number;
  saldoBersih: number;
  animatedSaldoBersih: number;
  onPeriodChange: (period: "current" | "previous") => void;
}

export const FinancialSummary = React.memo<FinancialSummaryProps>(
  ({
    currentMonthName,
    previousMonthName,
    year,
    selectedPeriod,
    totalSaldo,
    totalIncome,
    totalExpense,
    saldoBersih,
    animatedSaldoBersih,
    onPeriodChange,
  }) => {
    return (
      <Card style={styles.summaryCard} elevation={2}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Ringkasan Keuangan</Text>

          {/* Period Filter */}
          <View style={styles.periodFilter}>
            <Chip
              selected={selectedPeriod === "current"}
              onPress={() => onPeriodChange("current")}
              style={styles.periodChip}
            >
              {currentMonthName} {year}
            </Chip>
            <Chip
              selected={selectedPeriod === "previous"}
              onPress={() => onPeriodChange("previous")}
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
              <Text style={styles.statValue}>{formatCurrency(totalSaldo)}</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.statLabel}>Pemasukan</Text>
              <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                {formatCurrency(totalIncome)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <MaterialIcons name="trending-down" size={24} color="#F44336" />
              <Text style={styles.statLabel}>Pengeluaran</Text>
              <Text style={[styles.statValue, { color: "#F44336" }]}>
                {formatCurrency(totalExpense)}
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
                {formatCurrency(animatedSaldoBersih)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison untuk mencegah re-render tidak perlu
    return (
      prevProps.selectedPeriod === nextProps.selectedPeriod &&
      prevProps.totalSaldo === nextProps.totalSaldo &&
      prevProps.totalIncome === nextProps.totalIncome &&
      prevProps.totalExpense === nextProps.totalExpense &&
      prevProps.animatedSaldoBersih === nextProps.animatedSaldoBersih &&
      prevProps.year === nextProps.year
    );
  }
);

FinancialSummary.displayName = "FinancialSummary";

const styles = StyleSheet.create({
  summaryCard: {
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
});
