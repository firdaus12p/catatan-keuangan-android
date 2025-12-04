import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { InteractionManager, StyleSheet, Text, View } from "react-native";
import { Card, Chip } from "react-native-paper";
import { Category } from "../db/database";
import { colors } from "../styles/commonStyles";
import { formatCurrency } from "../utils/formatCurrency";

interface CategoryBalanceCardProps {
  categories: Category[];
  selectedCategoryIds: number[];
  showCategorySelector: boolean;
  animatedCategory1Balance: number;
  animatedCategory2Balance: number;
  animatedTotalCombined: number;
  onToggleSelector: () => void;
  onCategoryToggle: (categoryId: number) => void;
}

export const CategoryBalanceCard = React.memo<CategoryBalanceCardProps>(
  ({
    categories,
    selectedCategoryIds,
    showCategorySelector,
    animatedCategory1Balance,
    animatedCategory2Balance,
    animatedTotalCombined,
    onToggleSelector,
    onCategoryToggle,
  }) => {
    const selectedCategories = categories.filter(
      (cat) => cat.id && selectedCategoryIds.includes(cat.id)
    );

    const getAnimatedCategoryBalance = useCallback(
      (index: number) => {
        if (index === 0) return animatedCategory1Balance;
        if (index === 1) return animatedCategory2Balance;
        return 0;
      },
      [animatedCategory1Balance, animatedCategory2Balance]
    );

    return (
      <Card style={styles.summaryCard} elevation={2}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saldo Kategori</Text>
            <MaterialIcons
              name={showCategorySelector ? "expand-less" : "settings"}
              size={24}
              color="#666"
              onPress={() => {
                InteractionManager.runAfterInteractions(() => {
                  onToggleSelector();
                });
              }}
              style={styles.settingsButton}
            />
          </View>

          {/* Category Selector */}
          {showCategorySelector && (
            <View style={styles.categorySelector}>
              <Text style={styles.selectorLabel}>
                Pilih maksimal 2 kategori:
              </Text>
              <View style={styles.categoryChips}>
                {categories.map((category) => {
                  const isSelected = category.id
                    ? selectedCategoryIds.includes(category.id)
                    : false;
                  const isDisabled =
                    !selectedCategoryIds.includes(category.id || 0) &&
                    selectedCategoryIds.length >= 2;

                  console.log("[DEBUG Chip]", category.name, ":", {
                    id: category.id,
                    isSelected,
                    isDisabled,
                    selectedCategoryIds,
                    selectedLength: selectedCategoryIds.length,
                  });

                  return (
                    <Chip
                      key={category.id}
                      selected={isSelected}
                      onPress={() => {
                        console.log(
                          "[DEBUG Chip] onPress:",
                          category.id,
                          category.name
                        );
                        category.id && onCategoryToggle(category.id);
                      }}
                      style={styles.categoryChip}
                      disabled={isDisabled}
                    >
                      {category.name}
                    </Chip>
                  );
                })}
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
                    {formatCurrency(animatedTotalCombined)}
                  </Text>
                </View>
              )}

              {/* Individual Categories */}
              <View style={styles.selectedCategoriesGrid}>
                {selectedCategories.map((category, index) => (
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
                      {formatCurrency(getAnimatedCategoryBalance(index))}
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
  }
);

CategoryBalanceCard.displayName = "CategoryBalanceCard";

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
