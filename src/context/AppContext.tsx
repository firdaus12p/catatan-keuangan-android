import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Category,
  database,
  ExpenseType,
  Loan,
  LoanPayment,
  Transaction,
} from "../db/database";
import { initializeNotifications } from "../utils/notificationHelper";

type MonthlyStats = {
  totalIncome: number;
  totalExpense: number;
  totalSaldo: number;
  saldoBersih: number;
  totalOutstandingLoans: number;
};

const createEmptyStats = (): MonthlyStats => ({
  totalIncome: 0,
  totalExpense: 0,
  totalSaldo: 0,
  saldoBersih: 0,
  totalOutstandingLoans: 0,
});

// Interface untuk Context
interface AppContextType {
  // Categories
  categories: Category[];
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: number, category: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Expense Types
  expenseTypes: ExpenseType[];
  loadExpenseTypes: () => Promise<void>;
  addExpenseType: (name: string) => Promise<number>;
  updateExpenseType: (id: number, name: string) => Promise<void>;
  deleteExpenseType: (id: number) => Promise<void>;
  getExpenseTypeTotalsByMonth: (
    year: number,
    month: number
  ) => Promise<ExpenseType[]>;

  // Transactions
  transactions: Transaction[];
  loadTransactions: (limit?: number, offset?: number) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
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

  // Notifications
  initializeNotifications: () => Promise<void>;

  // Statistics
  monthlyStats: MonthlyStats;
  totalAllTimeBalance: number; // Total pemasukan kumulatif semua bulan
  loadMonthlyStats: (year: number, month: number) => Promise<void>;
  loadTotalAllTimeBalance: () => Promise<void>;

  // Reset functions
  resetAllData: () => Promise<void>;
  resetTransactions: () => Promise<void>;
  resetLoans: () => Promise<void>;
  resetCategories: () => Promise<void>;
  resetCategoryBalances: () => Promise<void>;
  cleanupLoanTransactions: () => Promise<void>;

  // Loading states
  loading: boolean;

  // Database initialization
  initializeApp: () => Promise<void>;
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
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>(
    createEmptyStats()
  );
  const [totalAllTimeBalance, setTotalAllTimeBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const runWithLoading = useCallback(
    async (task: () => Promise<void>): Promise<void> => {
      setLoading(true);
      try {
        await task();
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Categories methods
  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      const data = await database.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, []);

  const addCategory = useCallback(
    async (category: Omit<Category, "id">): Promise<void> => {
      try {
        await database.addCategory(category);
        await loadCategories(); // Refresh data
      } catch (error) {
        console.error("Error adding category:", error);
        throw error;
      }
    },
    [loadCategories]
  );

  const updateCategory = useCallback(
    async (id: number, category: Omit<Category, "id">): Promise<void> => {
      try {
        await database.updateCategory(id, category);
        await loadCategories(); // Refresh data
      } catch (error) {
        console.error("Error updating category:", error);
        throw error;
      }
    },
    [loadCategories]
  );

  const deleteCategory = useCallback(
    async (id: number): Promise<void> => {
      try {
        await database.deleteCategory(id);
        await loadCategories(); // Refresh data
      } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    },
    [loadCategories]
  );

  // Expense Types methods
  const loadExpenseTypes = useCallback(async (): Promise<void> => {
    try {
      const data = await database.getExpenseTypes();
      setExpenseTypes(data);
    } catch (error) {
      console.error("Error loading expense types:", error);
    }
  }, []);

  const getExpenseTypeTotalsByMonth = useCallback(
    async (year: number, month: number): Promise<ExpenseType[]> => {
      try {
        return await database.getExpenseTypeTotalsByMonth(year, month);
      } catch (error) {
        console.error("Error getting expense type totals by month:", error);
        throw error;
      }
    },
    []
  );

  const addExpenseType = useCallback(
    async (name: string): Promise<number> => {
      try {
        const insertedId = await database.addExpenseType(name);
        await loadExpenseTypes();
        return insertedId;
      } catch (error) {
        console.error("Error adding expense type:", error);
        throw error;
      }
    },
    [loadExpenseTypes]
  );

  const updateExpenseType = useCallback(
    async (id: number, name: string): Promise<void> => {
      try {
        await database.updateExpenseType(id, name);
        await loadExpenseTypes();
      } catch (error) {
        console.error("Error updating expense type:", error);
        throw error;
      }
    },
    [loadExpenseTypes]
  );

  const deleteExpenseType = useCallback(
    async (id: number): Promise<void> => {
      try {
        await database.deleteExpenseType(id);
        await loadExpenseTypes();
      } catch (error) {
        console.error("Error deleting expense type:", error);
        throw error;
      }
    },
    [loadExpenseTypes]
  );

  // Transactions methods
  const loadTransactions = useCallback(
    async (limit: number = 50, offset: number = 0): Promise<void> => {
      try {
        const data = await database.getTransactions(limit, offset);
        setTransactions(data);
      } catch (error) {
        console.error("Error loading transactions:", error);
      }
    },
    []
  );

  const loadMonthlyStats = useCallback(
    async (year: number, month: number): Promise<void> => {
      try {
        const [stats, currentLoans, categoriesData] = await Promise.all([
          database.getMonthlyStats(year, month),
          database.getAllLoans(),
          database.getAllCategories(),
        ]);

        const totalOutstandingLoans = currentLoans
          .filter((loan) => loan.status !== "paid")
          .reduce((sum, loan) => sum + loan.amount, 0);

        const totalCategoryBalance = categoriesData.reduce(
          (sum: number, cat: Category) => sum + cat.balance,
          0
        );

        setMonthlyStats({
          ...stats,
          totalSaldo: stats.totalIncome,
          saldoBersih: totalCategoryBalance,
          totalOutstandingLoans,
        });
      } catch (error) {
        console.error("Error loading monthly stats:", error);
      }
    },
    []
  );

  const loadTotalAllTimeBalance = useCallback(async (): Promise<void> => {
    try {
      const totalIncome = await database.getTotalIncome();
      setTotalAllTimeBalance(totalIncome);
    } catch (error) {
      console.error("Error loading total all-time balance:", error);
    }
  }, []);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id">): Promise<void> => {
      try {
        await database.addTransaction(transaction);
        await loadTransactions(); // Refresh data
        await loadCategories(); // Refresh categories untuk update saldo
        await loadExpenseTypes(); // Refresh jenis pengeluaran

        // Refresh statistik jika transaksi bulan ini
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        if (
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        ) {
          await loadMonthlyStats(now.getFullYear(), now.getMonth() + 1);
        }
      } catch (error) {
        console.error("Error adding transaction:", error);
        throw error;
      }
    },
    [loadCategories, loadExpenseTypes, loadMonthlyStats, loadTransactions]
  );

  const addGlobalIncome = useCallback(
    async (amount: number, note: string = "Pemasukan Global"): Promise<void> => {
      try {
        await database.addGlobalIncome(amount, note);
        await loadTransactions(); // Refresh data
        await loadCategories(); // Refresh categories untuk update saldo

        // Refresh statistik bulan ini
        const now = new Date();
        await loadMonthlyStats(now.getFullYear(), now.getMonth() + 1);
      } catch (error) {
        console.error("Error adding global income:", error);
        throw error;
      }
    },
    [loadCategories, loadMonthlyStats, loadTransactions]
  );

  // Loans methods
  const loadLoans = useCallback(async (): Promise<void> => {
    try {
      const data = await database.getAllLoans();
      setLoans(data);
    } catch (error) {
      console.error("Error loading loans:", error);
    }
  }, []);

  const addLoan = useCallback(
    async (loan: Omit<Loan, "id">): Promise<void> => {
      try {
        await database.addLoan(loan);
        await loadLoans(); // Refresh data
        await loadCategories(); // Refresh categories untuk update saldo
        await loadTransactions(); // Refresh transactions untuk update riwayat
      } catch (error) {
        console.error("Error adding loan:", error);
        throw error;
      }
    },
    [loadCategories, loadLoans, loadTransactions]
  );

  const updateLoanStatus = useCallback(
    async (
      id: number,
      status: "unpaid" | "half" | "paid",
      repaymentAmount?: number
    ): Promise<void> => {
      try {
        await database.updateLoanStatus(id, status, repaymentAmount);
        await loadLoans(); // Refresh data
        await loadCategories(); // Refresh categories untuk update saldo
        await loadTransactions(); // Refresh transactions untuk update riwayat
      } catch (error) {
        console.error("Error updating loan status:", error);
        throw error;
      }
    },
    [loadCategories, loadLoans, loadTransactions]
  );

  const deleteLoan = useCallback(
    async (id: number): Promise<void> => {
      try {
        await database.deleteLoan(id);
        await loadLoans(); // Refresh data
        await loadCategories(); // Update saldo kategori
      } catch (error) {
        console.error("Error deleting loan:", error);
        throw error;
      }
    },
    [loadCategories, loadLoans]
  );

  // Loan Payments methods
  const getLoanPayments = useCallback(
    async (loanId: number): Promise<LoanPayment[]> => {
      try {
        return await database.getLoanPayments(loanId);
      } catch (error) {
        console.error("Error getting loan payments:", error);
        throw error;
      }
    },
    []
  );

  // Statistics methods
  // Reset methods
  const resetAllData = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.resetAllData();
      await Promise.all([
        loadCategories(),
        loadTransactions(),
        loadExpenseTypes(),
        loadLoans(),
      ]);
      setMonthlyStats(createEmptyStats());
    });
  }, [loadCategories, loadExpenseTypes, loadLoans, loadTransactions, runWithLoading]);

  const resetTransactions = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.resetTransactions();
      await Promise.all([loadCategories(), loadTransactions(), loadExpenseTypes()]);
      setMonthlyStats(createEmptyStats());
    });
  }, [loadCategories, loadExpenseTypes, loadTransactions, runWithLoading]);

  const resetLoans = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.resetLoans();
      await loadLoans();
    });
  }, [loadLoans, runWithLoading]);

  const resetCategories = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.resetCategories();
      await Promise.all([loadCategories(), loadTransactions(), loadLoans()]);
      setMonthlyStats(createEmptyStats());
    });
  }, [loadCategories, loadLoans, loadTransactions, runWithLoading]);

  const resetCategoryBalances = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.resetCategoryBalances();
      await loadCategories();
      setMonthlyStats(createEmptyStats());
    });
  }, [loadCategories, runWithLoading]);

  const cleanupLoanTransactions = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.cleanupLoanTransactions();
      await Promise.all([
        loadTransactions(),
        loadCategories(),
        loadExpenseTypes(),
      ]);
      const now = new Date();
      await loadMonthlyStats(now.getFullYear(), now.getMonth() + 1);
    });
  }, [
    loadCategories,
    loadExpenseTypes,
    loadMonthlyStats,
    loadTransactions,
    runWithLoading,
  ]);

  // Initialize notifications saat app pertama kali dibuka
  const handleInitializeNotifications = useCallback(async (): Promise<void> => {
    try {
      await initializeNotifications();
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }, []);

  const initializeApp = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.initializeDatabase();
      await Promise.all([
        loadCategories(),
        loadTransactions(),
        loadExpenseTypes(),
        loadLoans(),
      ]);

      const now = new Date();
      await loadMonthlyStats(now.getFullYear(), now.getMonth() + 1);
      await handleInitializeNotifications();
    });
  }, [
    handleInitializeNotifications,
    loadCategories,
    loadExpenseTypes,
    loadLoans,
    loadMonthlyStats,
    loadTransactions,
    runWithLoading,
  ]);

  const value = useMemo<AppContextType>(
    () => ({
      // Categories
      categories,
      loadCategories,
      addCategory,
      updateCategory,
      deleteCategory,

      // Expense Types
      expenseTypes,
      loadExpenseTypes,
      addExpenseType,
      updateExpenseType,
      deleteExpenseType,
      getExpenseTypeTotalsByMonth,

      // Transactions
      transactions,
      loadTransactions,
      addTransaction,
      addGlobalIncome,

      // Loans
      loans,
      loadLoans,
      addLoan,
      updateLoanStatus,
      deleteLoan,

      // Loan Payments
      getLoanPayments,

      // Notifications
      initializeNotifications: handleInitializeNotifications,

      // Statistics
      monthlyStats,
      totalAllTimeBalance,
      loadMonthlyStats,
      loadTotalAllTimeBalance,

      // Reset functions
      resetAllData,
      resetTransactions,
      resetLoans,
      resetCategories,
      resetCategoryBalances,
      cleanupLoanTransactions,

      // Loading state
      loading,

      // App initialization
      initializeApp,
    }),
    [
      addCategory,
      addExpenseType,
      addGlobalIncome,
      addLoan,
      addTransaction,
      categories,
      cleanupLoanTransactions,
      deleteCategory,
      deleteExpenseType,
      deleteLoan,
      getExpenseTypeTotalsByMonth,
      expenseTypes,
      getLoanPayments,
      handleInitializeNotifications,
      initializeApp,
      loadCategories,
      loadExpenseTypes,
      loadLoans,
      loadMonthlyStats,
      loadTotalAllTimeBalance,
      loadTransactions,
      loans,
      loading,
      monthlyStats,
      resetAllData,
      resetCategories,
      resetCategoryBalances,
      resetLoans,
      resetTransactions,
      totalAllTimeBalance,
      updateCategory,
      updateExpenseType,
      updateLoanStatus,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook untuk menggunakan Context
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
