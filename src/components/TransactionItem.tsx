import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface Props {
  note: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  categoryName: string;
  onPress?: () => void;
}

export function TransactionItem({ note, amount, type, date, categoryName, onPress }: Props) {
  const theme = useTheme();
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

  const color = type === "income" ? theme.colors.secondary : theme.colors.error;

  return (
    <Pressable style={[styles.container, { backgroundColor: theme.colors.surface }]} onPress={onPress}>
      <View>
        <Text variant="titleMedium">{note}</Text>
        <Text variant="bodySmall">{categoryName}</Text>
        <Text variant="bodySmall">{new Date(date).toLocaleDateString("id-ID")}</Text>
      </View>
      <Text variant="titleMedium" style={{ color }}>
        {type === "income" ? "+" : "-"}
        {formattedAmount}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
