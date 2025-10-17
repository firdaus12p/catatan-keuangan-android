import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "react-native-paper";
import { Category, Transaction } from "../db/database";
import { colors } from "../styles/commonStyles";
import { formatDate } from "../utils/dateHelper";
import { formatCurrency } from "../utils/formatCurrency";

interface TransactionItemProps {
  transaction: Transaction;
  categories: Category[];
}

export const TransactionItem: React.FC<TransactionItemProps> = React.memo(
  ({ transaction, categories }) => {
    // Cari nama kategori berdasarkan category_id
    const categoryName =
      categories.find((cat) => cat.id === transaction.category_id)?.name ||
      "Kategori Tidak Diketahui";

    const expenseTypeName =
      transaction.type === "expense" && transaction.expense_type_name
        ? transaction.expense_type_name
        : null;

    // Tentukan warna dan icon berdasarkan tipe transaksi
    const isIncome = transaction.type === "income";
    const iconName = isIncome ? "trending-up" : "trending-down";
    const amountColor = isIncome ? "#4CAF50" : "#F44336";
    const backgroundColor = isIncome ? "#E8F5E8" : "#FFEBEE";
    const borderColor = isIncome ? "#4CAF50" : "#F44336";

    return (
      <Card
        style={[styles.card, { borderLeftColor: borderColor }]}
        elevation={1}
      >
        <Card.Content style={styles.content}>
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor }]}>
              <MaterialIcons name={iconName} size={24} color={amountColor} />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.categoryText}>{categoryName}</Text>
              <Text style={styles.noteText} numberOfLines={2}>
                {transaction.note || "Tidak ada catatan"}
              </Text>
              {expenseTypeName && (
                <Text style={styles.expenseTypeText} numberOfLines={1}>
                  Jenis: {expenseTypeName}
                </Text>
              )}
              <Text style={styles.dateText}>
                {formatDate(transaction.date)}
              </Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={[styles.amountText, { color: amountColor }]}>
              {isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.typeText}>
              {isIncome ? "Pemasukan" : "Pengeluaran"}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 2,
  },
  noteText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  expenseTypeText: {
    fontSize: 12,
    color: colors.expense,
    fontWeight: "600",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#999999",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  typeText: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },
});
