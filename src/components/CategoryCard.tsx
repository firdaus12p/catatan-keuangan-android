import { StyleSheet, View } from "react-native";
import { IconButton, ProgressBar, Text, useTheme } from "react-native-paper";

import type { Category } from "@/src/context/AppContext";
import { formatCurrency } from "@/src/utils/formatCurrency";

interface Props {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export function CategoryCard({ category, onEdit, onDelete }: Props) {
  const theme = useTheme();
  const progress = Math.min(category.percentage / 100, 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View>
          <Text variant="titleMedium">{category.name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
            {category.percentage}% alokasi
          </Text>
        </View>
        <View style={styles.actions}>
          {onEdit ? (
            <IconButton
              icon="pencil-outline"
              size={20}
              onPress={() => onEdit(category)}
              accessibilityLabel="Edit kategori"
            />
          ) : null}
          {onDelete ? (
            <IconButton
              icon="trash-can-outline"
              iconColor={theme.colors.error}
              size={20}
              onPress={() => onDelete(category)}
              accessibilityLabel="Hapus kategori"
            />
          ) : null}
        </View>
      </View>
      <Text variant="headlineSmall">{formatCurrency(category.balance)}</Text>
      <ProgressBar progress={progress} color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
});

