import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import {
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card, ProgressBar } from "react-native-paper";
import { ExpenseType } from "../db/database";
import { colors } from "../styles/commonStyles";
import { formatCurrency } from "../utils/formatCurrency";

interface ExpenseTypeHighlightProps {
  expenseTypeBreakdown: ExpenseType[];
  onOpenManager: () => void;
}

export const ExpenseTypeHighlight = React.memo<ExpenseTypeHighlightProps>(
  ({ expenseTypeBreakdown, onOpenManager }) => {
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

    const handleOpenManager = useCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        onOpenManager();
      });
    }, [onOpenManager]);

    return (
      <Card style={styles.expenseHighlightCard} elevation={2}>
        <Card.Content>
          <View style={styles.expenseHighlightHeader}>
            <Text style={styles.expenseHighlightTitle}>
              Pengeluaran Terbanyak
            </Text>
            <TouchableOpacity
              onPress={handleOpenManager}
              style={styles.expenseHighlightSettings}
            >
              <MaterialIcons name="settings" size={20} color={colors.expense} />
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
                  totalExpenseTypeSpent > 0
                    ? amount / totalExpenseTypeSpent
                    : 0;

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
                Tambahkan transaksi pengeluaran untuk melihat jenis yang paling
                mendominasi.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison
    const prevTotal = prevProps.expenseTypeBreakdown.reduce(
      (sum, type) => sum + (type.total_spent ?? 0),
      0
    );
    const nextTotal = nextProps.expenseTypeBreakdown.reduce(
      (sum, type) => sum + (type.total_spent ?? 0),
      0
    );

    return (
      prevTotal === nextTotal &&
      prevProps.expenseTypeBreakdown.length ===
        nextProps.expenseTypeBreakdown.length
    );
  }
);

ExpenseTypeHighlight.displayName = "ExpenseTypeHighlight";

const styles = StyleSheet.create({
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
  emptyChartText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
  expenseHighlightDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});
