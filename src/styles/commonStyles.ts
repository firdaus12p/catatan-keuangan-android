import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
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
    fontWeight: "bold" as const,
  },
  headerSubtitle: {
    color: "#E3F2FD",
    fontSize: 14,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#333333",
    marginBottom: 16,
  },
  flexRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  flexColumn: {
    flexDirection: "column" as const,
  },
  flex1: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center" as const,
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    textAlign: "center" as const,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#CCC",
    marginTop: 4,
    textAlign: "center" as const,
  },
});

export const colors = {
  primary: "#2196F3", // Blue - Main theme, Home
  success: "#4CAF50", // Green - Income, Transaction
  error: "#F44336", // Red - Expense, Delete actions
  warning: "#FF9800", // Orange - Loan, Warning
  secondary: "#9C27B0", // Purple - Category
  info: "#607D8B", // Blue Grey - Notification, Info
  background: "#F5F5F5",
  surface: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#E0E0E0",

  // Semantic colors for better organization
  income: "#4CAF50", // Green for income
  expense: "#F44336", // Red for expense
  loan: "#FF9800", // Orange for loan
  category: "#9C27B0", // Purple for category
  home: "#2196F3", // Blue for home
  notification: "#607D8B", // Blue grey for notification
  analytics: "#673AB7", // Deep purple for analytics
};
