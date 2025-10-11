import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export function ChartCard({ title, children }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium">{title}</Text>
      <View style={styles.chartContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  chartContainer: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
  },
});

