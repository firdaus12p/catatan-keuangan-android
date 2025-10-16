import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import DatabaseOperations, {
  Category,
  ExpenseType,
  Loan,
  LoanPayment,
  Transaction,
} from "../db/database";
import { initializeNotifications } from "../utils/notificationHelper";

// Interface untuk Context
interface AppContextType {
  // Categories
  categories: Category[];
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: number, category: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  forceDeleteCategory: (id: number) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  loadTransactions: (limit?: number, offset?: number) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (
    id: number,
    transaction: Omit<Transaction, "id">
  ) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  addGlobalIncome: (amount: number, note?: string) => Promise<void>;

  // Loans
  loans: Loan[];
  loadLoans: () => Promise<void>;
  addLoan: (loan: Omit<Loan, "id">) => Promise<void>;
  updateLoanStatus: (
    id: number,
    status: "unpaid" | "half" | "paid",
    repaymentAmount?: number
  ) => Promise<void>;
  deleteLoan: (id: number) => Promise<void>;

  // Loan Payments
  getLoanPayments: (loanId: number) => Promise<LoanPayment[]>;

  // Expense Types
  expenseTypes: ExpenseType[];
  loadExpenseTypes: () => Promise<void>;
  addExpenseType: (expenseType: Omit<ExpenseType, "id">) => Promise<void>;
  updateExpenseType: (
    id: number,
    expenseType: Omit<ExpenseType, "id">
  ) => Promise<void>;
  deleteExpenseType: (id: number) => Promise<void>;

  // Stats
  getExpenseStatsByType: (
    startDate?: string,
    endDate?: string
  ) => Promise<any[]>;

  // Monthly stats
  monthlyStats: {
    totalIncome: number;
    totalExpense: number;
    totalSaldo: number;
    saldoBersih: number;
    totalOutstandingLoans: number;
  };
  loadMonthlyStats: (year: number, month: number) => Promise<void>;
  totalAllTimeBalance: number;
  loadTotalAllTimeBalance: () => Promise<void>;

  // Loading states
  loading: boolean;
  isProcessingTransaction: boolean;

  // Database initialization
  initializeApp: () => Promise<void>;
  resetAllData: () => Promise<void>;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Props
interface AppProviderProps {
  children: ReactNode;
}

// Provider Component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSaldo: 0, // Total pemasukan yang tercatat bulan ini
    saldoBersih: 0, // Saldo yang tersedia saat ini (dipengaruhi pinjaman)
    totalOutstandingLoans: 0, // Total pinjaman yang belum lunas
  });
  const [totalAllTimeBalance, setTotalAllTimeBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function untuk membuat empty stats
  const createEmptyStats = () => ({
    totalIncome: 0,
    totalExpense: 0,
    totalSaldo: 0,
    saldoBersih: 0,
    totalOutstandingLoans: 0,
  });

  // Initialize database dan load data awal
  const initializeApp = useCallback(async (): Promise<void> => {
    if (loading || isInitialized) {
      console.log(
        "⏳ App initialization already in progress or completed, skipping..."
      );
      return;
    }

    try {
      setLoading(true);
      console.log("🚀 Initializing app...");

      // Initialize database first
      await DatabaseOperations.initialize();

      // Load data sequentially to avoid concurrent operations
      console.log("📊 Loading categories...");
      await loadCategories();

      console.log("💰 Loading transactions...");
      await loadTransactions();

      console.log("🤝 Loading loans...");
      await loadLoans();

      console.log("🏷️ Loading expense types...");
      await loadExpenseTypes();

      // Initialize notifications
      console.log("🔔 Initializing notifications...");
      await handleInitializeNotifications();

      setIsInitialized(true);
      console.log("✅ App initialization completed!");
    } catch (error) {
      console.error("❌ Error initializing app:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, isInitialized]);

  // Reset all data method
  const resetAllData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      console.log("🗑️ Resetting all data...");

      await DatabaseOperations.resetAllData();

      // Reload all data after reset
      await Promise.all([
        loadCategories(),
        loadTransactions(),
        loadLoans(),
        loadExpenseTypes(),
      ]);

      console.log("✅ All data reset successfully!");
    } catch (error) {
      console.error("❌ Error resetting data:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Categories methods
  const loadCategories = async (): Promise<void> => {
    try {
      const data = await DatabaseOperations.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const addCategory = async (category: Omit<Category, "id">): Promise<void> => {
    try {
      await DatabaseOperations.addCategory(category);
      await loadCategories(); // Refresh data
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  };

  const updateCategory = async (
    id: number,
    category: Omit<Category, "id">
  ): Promise<void> => {
    try {
      await DatabaseOperations.updateCategory(id, category);
      await loadCategories(); // Refresh data
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  };

  const deleteCategory = async (id: number): Promise<void> => {
    try {
      await DatabaseOperations.deleteCategory(id);
      await loadCategories(); // Refresh data
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };

  const forceDeleteCategory = async (id: number): Promise<void> => {
    try {
      await DatabaseOperations.forcedeleteCategory(id);
      await loadCategories(); // Refresh data
      await loadTransactions(); // Refresh transactions as some may have been deleted
      await loadLoans(); // Refresh loans as some may have been deleted
    } catch (error) {
      console.error("Error force deleting category:", error);
      throw error;
    }
  };

  // Transactions methods
  const loadTransactions = async (
    limit: number = 50,
    offset: number = 0
  ): Promise<void> => {
    try {
      const data = await DatabaseOperations.getAllTransactions(limit, offset);
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const addTransaction = async (
    transaction: Omit<Transaction, "id">
  ): Promise<void> => {
    if (isProcessingTransaction) return; // Prevent concurrent transactions

    setIsProcessingTransaction(true);
    try {
      console.log("💰 Adding transaction...");
      await DatabaseOperations.addTransaction(transaction);

      // Only reload what's necessary for performance
      if (transaction.type === "income") {
        // For income, reload categories (balance update) and transactions
        await Promise.all([loadCategories(), loadTransactions()]);
      } else if (transaction.type === "expense") {
        // For expense, also reload categories since balance changes now
        await Promise.all([loadCategories(), loadTransactions()]);
      } else {
        // For other types, just reload transactions
        await loadTransactions();
      }

      console.log("✅ Transaction added successfully");
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const updateTransaction = async (
    id: number,
    transaction: Omit<Transaction, "id">
  ): Promise<void> => {
    try {
      await DatabaseOperations.updateTransaction(id, transaction);
      await loadTransactions(); // Refresh data
      await loadCategories(); // Update balances
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  };

  const deleteTransaction = async (id: number): Promise<void> => {
    try {
      await DatabaseOperations.deleteTransaction(id);
      await loadTransactions(); // Refresh data
      await loadCategories(); // Update balances
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  };

  // Global income distribution logic - temporary placeholder
  const addGlobalIncome = async (
    amount: number,
    note: string = "Pendapatan Global"
  ): Promise<void> => {
    if (isProcessingTransaction) return; // Prevent concurrent transactions

    setIsProcessingTransaction(true);
    try {
      console.log(`💰 Distributing global income: ${amount}`);

      const today = new Date().toISOString().split("T")[0];
      const distributionTransactions: Array<Omit<Transaction, "id">> = [];

      // Calculate distribution for each category
      for (const category of categories) {
        if (category.percentage > 0) {
          const distributedAmount = (amount * category.percentage) / 100;

          distributionTransactions.push({
            type: "income",
            amount: distributedAmount,
            category_id: category.id!,
            note: `${note} (${category.percentage}% dari ${amount})`,
            date: today,
          });

          console.log(
            `  → ${category.name}: ${distributedAmount} (${category.percentage}%)`
          );
        }
      }

      // Add all transactions in a single batch (much faster!)
      if (distributionTransactions.length > 0) {
        await DatabaseOperations.addMultipleTransactions(
          distributionTransactions
        );

        // Single refresh after batch operation
        await Promise.all([loadCategories(), loadTransactions()]);
      }

      console.log("✅ Global income distributed successfully");
    } catch (error) {
      console.error("Error adding global income:", error);
      throw error;
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  // Loans methods
  const loadLoans = async (): Promise<void> => {
    try {
      const data = await DatabaseOperations.getAllLoans();
      setLoans(data);
    } catch (error) {
      console.error("Error getting loans:", error);
    }
  };

  const addLoan = async (loan: Omit<Loan, "id">): Promise<void> => {
    try {
      console.log(
        `🤝 Adding loan: ${loan.amount} from category ${loan.category_id}`
      );
      await DatabaseOperations.addLoan(loan);
      // Refresh loans and categories since balance changes
      await Promise.all([loadLoans(), loadCategories()]);
      console.log("✅ Loan added successfully");
    } catch (error) {
      console.error("Error adding loan:", error);
      throw error;
    }
  };

  const updateLoanStatus = async (
    id: number,
    status: "unpaid" | "half" | "paid",
    repaymentAmount?: number
  ): Promise<void> => {
    try {
      console.log(`🤝 Updating loan ${id} status to: ${status}`);
      const loan = loans.find((l) => l.id === id);
      if (loan) {
        await DatabaseOperations.updateLoan(id, { ...loan, status });
        // Refresh loans and categories since balance changes
        await Promise.all([loadLoans(), loadCategories()]);
        console.log("✅ Loan status updated successfully");
      } else {
        throw new Error("Loan not found");
      }
    } catch (error) {
      console.error("Error updating loan status:", error);
      throw error;
    }
  };

  const deleteLoan = async (id: number): Promise<void> => {
    try {
      console.log(`🤝 Deleting loan: ${id}`);
      await DatabaseOperations.deleteLoan(id);
      // Refresh loans and categories since balance changes
      await Promise.all([loadLoans(), loadCategories()]);
      console.log("✅ Loan deleted successfully");
    } catch (error) {
      console.error("Error deleting loan:", error);
      throw error;
    }
  };

  const getLoanPayments = async (loanId: number): Promise<LoanPayment[]> => {
    try {
      // Placeholder - not implemented in new database structure
      return [];
    } catch (error) {
      console.error("Error getting loan payments:", error);
      throw error;
    }
  };

  // Expense Types methods
  const loadExpenseTypes = async (): Promise<void> => {
    try {
      const data = await DatabaseOperations.getAllExpenseTypes();
      setExpenseTypes(data);
    } catch (error) {
      console.error("Error loading expense types:", error);
    }
  };

  const addExpenseType = async (
    expenseType: Omit<ExpenseType, "id">
  ): Promise<void> => {
    try {
      await DatabaseOperations.addExpenseType(expenseType);
      await loadExpenseTypes(); // Refresh data
    } catch (error) {
      console.error("Error adding expense type:", error);
      throw error;
    }
  };

  const updateExpenseType = async (
    id: number,
    expenseType: Omit<ExpenseType, "id">
  ): Promise<void> => {
    try {
      await DatabaseOperations.updateExpenseType(id, expenseType);
      await loadExpenseTypes(); // Refresh data
    } catch (error) {
      console.error("Error updating expense type:", error);
      throw error;
    }
  };

  const deleteExpenseType = async (id: number): Promise<void> => {
    try {
      await DatabaseOperations.deleteExpenseType(id);
      await loadExpenseTypes(); // Refresh data
    } catch (error) {
      console.error("Error deleting expense type:", error);
      throw error;
    }
  };

  // Stats methods
  const getExpenseStatsByType = async (
    startDate?: string,
    endDate?: string
  ): Promise<any[]> => {
    try {
      return await DatabaseOperations.getExpenseStatsByType();
    } catch (error) {
      console.error("Error getting expense stats by type:", error);
      return [];
    }
  };

  const loadMonthlyStats = useCallback(
    async (year: number, month: number): Promise<void> => {
      try {
        console.log("📈 Loading monthly stats...");

        // Get transaction stats for the specified month
        const stats = await DatabaseOperations.getMonthlyStats();
        let totalIncome = 0;
        let totalExpense = 0;

        if (stats && stats.length > 0) {
          const currentMonthStats = stats[0]; // Get latest month stats
          totalIncome = currentMonthStats.income || 0;
          totalExpense = currentMonthStats.expense || 0;
        }

        // Get fresh data from database instead of using state to avoid dependencies
        const freshCategories = await DatabaseOperations.getAllCategories();
        const freshLoans = await DatabaseOperations.getAllLoans();

        // Calculate current total saldo from fresh categories data
        const totalSaldo = freshCategories.reduce(
          (sum, cat) => sum + cat.balance,
          0
        );

        // Calculate total outstanding loans from fresh loans data
        const totalOutstandingLoans = freshLoans
          .filter((loan) => loan.status === "unpaid" || loan.status === "half")
          .reduce((sum, loan) => {
            if (loan.status === "unpaid") {
              return sum + loan.amount; // Full amount outstanding
            } else if (loan.status === "half") {
              return sum + loan.amount / 2; // Half amount outstanding
            }
            return sum;
          }, 0);

        // Calculate saldo bersih (current balance - outstanding loans)
        const saldoBersih = totalSaldo;

        setMonthlyStats({
          totalIncome,
          totalExpense,
          totalSaldo, // Current real balance from categories
          saldoBersih, // Same as totalSaldo since loans are already deducted from categories
          totalOutstandingLoans,
        });

        console.log(
          `📊 Stats updated: Saldo=${totalSaldo}, Outstanding Loans=${totalOutstandingLoans}`
        );
      } catch (error) {
        console.error("Error loading monthly stats:", error);
        setMonthlyStats(createEmptyStats());
      }
    },
    []
  ); // No dependencies to prevent infinite loop - stats calculated from current state

  const loadTotalAllTimeBalance = async (): Promise<void> => {
    try {
      const stats = await DatabaseOperations.getMonthlyStats();
      let totalBalance = 0;

      stats.forEach((stat) => {
        totalBalance += (stat.income || 0) - (stat.expense || 0);
      });

      setTotalAllTimeBalance(totalBalance);
    } catch (error) {
      console.error("Error loading total all time balance:", error);
      setTotalAllTimeBalance(0);
    }
  };

  // Notification helper function
  const handleInitializeNotifications = async (): Promise<void> => {
    try {
      await initializeNotifications();
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  };

  // Context value
  const value: AppContextType = {
    categories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    forceDeleteCategory,
    transactions,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGlobalIncome,
    loans,
    loadLoans,
    addLoan,
    updateLoanStatus,
    deleteLoan,
    getLoanPayments,
    expenseTypes,
    loadExpenseTypes,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType,
    getExpenseStatsByType,
    monthlyStats,
    loadMonthlyStats,
    totalAllTimeBalance,
    loadTotalAllTimeBalance,
    loading,
    isProcessingTransaction,
    initializeApp,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook untuk menggunakan context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export default AppContext;
