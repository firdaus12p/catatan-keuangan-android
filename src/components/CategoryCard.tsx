import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Card, IconButton, ProgressBar } from "react-native-paper";
import { Category } from "../db/database";
import { colors } from "../styles/commonStyles";
import { formatCurrency } from "../utils/formatCurrency";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = React.memo(
  ({ category, onEdit, onDelete }) => {
    const handleDelete = () => {
      Alert.alert(
        "Hapus Kategori",
        `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: () => onDelete(category.id!),
          },
        ]
      );
    };

    // Warna berdasarkan saldo
    const getBalanceColor = (balance: number) => {
      if (balance > 100000) return "#4CAF50"; // Hijau untuk saldo tinggi
      if (balance > 50000) return "#FF9800"; // Orange untuk saldo sedang
      if (balance > 0) return "#FFC107"; // Kuning untuk saldo rendah
      return "#F44336"; // Merah untuk saldo kosong/minus
    };

    return (
      <Card style={styles.card} elevation={2}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialIcons
                name="category"
                size={24}
                color="#2196F3"
                style={styles.icon}
              />
              <View>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.percentage}>{category.percentage}%</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor="#2196F3"
                onPress={() => onEdit(category)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#F44336"
                onPress={handleDelete}
              />
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Saldo:</Text>
            <Text
              style={[
                styles.balanceAmount,
                { color: getBalanceColor(category.balance) },
              ]}
            >
              {formatCurrency(category.balance)}
            </Text>
          </View>

          {/* Progress bar untuk visualisasi persentase */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              Alokasi: {category.percentage}%
            </Text>
            <ProgressBar
              progress={category.percentage / 100}
              color="#2196F3"
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.category,
    marginBottom: 2,
  },
  percentage: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666666",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
