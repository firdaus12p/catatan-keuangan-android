import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { InteractionManager } from "react-native";
import {
  Category,
  database,
  ExpenseType,
  Loan,
  LoanPayment,
  Transaction,
} from "../db/database";
import {
  cleanupNotificationListener,
  initializeNotifications,
} from "../utils/notificationHelper";

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
  transferCategoryBalance: (
    sourceCategoryId: number,
    targetCategoryId: number,
    amount: number
  ) => Promise<void>;

  // Optimized data loading
  loadAllData: (limit?: number, offset?: number) => Promise<void>;

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
  hasMoreTransactions: boolean; // ✅ PAGINATION: Track if more data available
  loadTransactions: (
    limit?: number,
    offset?: number,
    append?: boolean
  ) => Promise<void>;
  loadMoreTransactions: () => Promise<void>; // ✅ PAGINATION: Load next batch
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  addGlobalIncome: (amount: number, note?: string) => Promise<void>;
  addMultiCategoryIncome: (
    amount: number,
    categoryIds: number[],
    note?: string
  ) => Promise<void>;

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
  clearTransactionHistory: () => Promise<number>; // ✅ NEW: Clear history only, keep balances

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
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true); // ✅ PAGINATION
  const transactionOffsetRef = useRef(0); // ✅ PAGINATION: Track current offset
  const [loans, setLoans] = useState<Loan[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>(
    createEmptyStats()
  );
  const [totalAllTimeBalance, setTotalAllTimeBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ PERFORMANCE OPTIMIZATION: Flag untuk cleanup transaksi lama
  // Cleanup hanya dijalankan sekali per session untuk menghindari overhead berulang
  // Lihat cleanupOldTransactions() di loadTransactions()
  const hasRunCleanup = useRef(false);

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
    } catch (error) {}
  }, []);

  const addCategory = useCallback(
    async (category: Omit<Category, "id">): Promise<void> => {
      try {
        await database.addCategory(category);
        await loadCategories(); // Refresh data
      } catch (error) {
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
        throw error;
      }
    },
    [loadCategories]
  );

  const transferCategoryBalance = useCallback(
    async (
      sourceCategoryId: number,
      targetCategoryId: number,
      amount: number
    ): Promise<void> => {
      try {
        await database.transferCategoryBalance(
          sourceCategoryId,
          targetCategoryId,
          amount
        );
        await loadCategories();
      } catch (error) {
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
    } catch (error) {}
  }, []);

  const getExpenseTypeTotalsByMonth = useCallback(
    async (year: number, month: number): Promise<ExpenseType[]> => {
      try {
        return await database.getExpenseTypeTotalsByMonth(year, month);
      } catch (error) {
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
        throw error;
      }
    },
    [loadExpenseTypes]
  );

  // Transactions methods
  // ✅ PERFORMANCE OPTIMIZATION: Pagination dengan append mode
  // - limit: Jumlah data per batch (default 50)
  // - offset: Starting point untuk query (tracked via transactionOffsetRef)
  // - append: true = concat data, false = replace data (untuk refresh)
  // Lihat handleLoadMore() di AddTransactionScreen.tsx untuk infinite scroll
  const loadTransactions = useCallback(
    async (
      limit: number = 50,
      offset: number = 0,
      append: boolean = false
    ): Promise<void> => {
      try {
        const data = await database.getTransactions(limit, offset);

        if (append) {
          // ✅ PAGINATION: Append mode untuk infinite scroll
          // ✅ OPTIMIZED: Use .concat() instead of spread for better performance
          setTransactions((prev) => prev.concat(data));
        } else {
          // Replace mode untuk initial load atau refresh
          setTransactions(data);
          transactionOffsetRef.current = 0; // Reset offset
        }

        // Track if more data available (jika data < limit, berarti sudah habis)
        setHasMoreTransactions(data.length >= limit);

        if (append) {
          // Update offset untuk next load
          transactionOffsetRef.current = offset + data.length;
        } else {
          // Initial load offset
          transactionOffsetRef.current = data.length;
        }

        // ✅ PERFORMANCE OPTIMIZATION: Cleanup transaksi lama (hanya initial load)
        // Menghapus record transaksi >3 bulan untuk mengurangi beban database
        // CATATAN: Balance kategori TIDAK terpengaruh (tetap akurat)
        // Menggunakan InteractionManager agar tidak blocking UI
        if (!append && !hasRunCleanup.current) {
          hasRunCleanup.current = true;
          InteractionManager.runAfterInteractions(async () => {
            try {
              // Cleanup transaksi yang lebih dari 3 bulan
              const deletedCount = await database.cleanupOldTransactions(3);
              if (deletedCount > 0) {
                console.log(
                  `[CLEANUP] Cleaned up ${deletedCount} old transactions (>3 months)`
                );
              }
            } catch (error) {
              // Silent failure untuk cleanup - tidak mengganggu user experience
            }
          });
        }
      } catch (error) {
        throw error;
      }
    },
    []
  );

  // ✅ PAGINATION: Load more transactions for infinite scroll
  const loadMoreTransactions = useCallback(async (): Promise<void> => {
    if (!hasMoreTransactions) return; // No more data to load

    try {
      await loadTransactions(50, transactionOffsetRef.current, true); // append=true
    } catch (error) {
      throw error;
    }
  }, [hasMoreTransactions, loadTransactions]);

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
      } catch (error) {}
    },
    []
  );

  const loadTotalAllTimeBalance = useCallback(async (): Promise<void> => {
    try {
      const totalIncome = await database.getTotalIncome();
      setTotalAllTimeBalance(totalIncome);
    } catch (error) {}
  }, []);

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id">): Promise<void> => {
      try {
        await database.addTransaction(transaction);
        const refreshTasks: Promise<void>[] = [
          loadTransactions(), // Refresh data
          loadCategories(), // Refresh categories untuk update saldo
          loadExpenseTypes(), // Refresh jenis pengeluaran
        ];

        const transactionDate = new Date(transaction.date);
        const now = new Date();
        if (
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        ) {
          refreshTasks.push(
            loadMonthlyStats(now.getFullYear(), now.getMonth() + 1)
          );
        }

        await Promise.all(refreshTasks);
      } catch (error) {
        throw error;
      }
    },
    [loadCategories, loadExpenseTypes, loadMonthlyStats, loadTransactions]
  );

  const addGlobalIncome = useCallback(
    async (
      amount: number,
      note: string = "Pemasukan Global"
    ): Promise<void> => {
      try {
        await database.addGlobalIncome(amount, note);
        const now = new Date();
        await Promise.all([
          loadTransactions(), // Refresh data
          loadCategories(), // Refresh categories untuk update saldo
          loadMonthlyStats(now.getFullYear(), now.getMonth() + 1), // Refresh statistik bulan ini
        ]);
      } catch (error) {
        throw error;
      }
    },
    [loadCategories, loadMonthlyStats, loadTransactions]
  );
  const addMultiCategoryIncome = useCallback(
    async (
      amount: number,
      categoryIds: number[],
      note: string = "Pemasukan Multi Kategori"
    ): Promise<void> => {
      try {
        await database.addMultiCategoryIncome(amount, categoryIds, note);
        const now = new Date();
        await Promise.all([
          loadTransactions(), // Refresh data
          loadCategories(), // Refresh categories untuk update saldo
          loadMonthlyStats(now.getFullYear(), now.getMonth() + 1), // Refresh statistik bulan ini
        ]);
      } catch (error) {
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
    } catch (error) {}
  }, []);

  // ✅ OPTIMIZED: Load all data in parallel for better performance
  const loadAllData = useCallback(
    async (limit: number = 50, offset: number = 0): Promise<void> => {
      setLoading(true);
      try {
        const [categoriesData, transactionsData, loansData, expenseTypesData] =
          await Promise.all([
            database.getAllCategories(),
            database.getTransactions(limit, offset),
            database.getAllLoans(),
            database.getExpenseTypes(),
          ]);

        setCategories(categoriesData);
        setTransactions(transactionsData);
        setLoans(loansData);
        setExpenseTypes(expenseTypesData);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addLoan = useCallback(
    async (loan: Omit<Loan, "id">): Promise<void> => {
      try {
        await database.addLoan(loan);
        // ✅ OPTIMIZED: Parallel data refresh
        await Promise.all([loadLoans(), loadCategories(), loadTransactions()]);
      } catch (error) {
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
        // ✅ OPTIMIZED: Parallel data refresh
        await Promise.all([loadLoans(), loadCategories(), loadTransactions()]);
      } catch (error) {
        throw error;
      }
    },
    [loadCategories, loadLoans, loadTransactions]
  );

  const deleteLoan = useCallback(
    async (id: number): Promise<void> => {
      try {
        await database.deleteLoan(id);
        // ✅ OPTIMIZED: Parallel data refresh
        await Promise.all([loadLoans(), loadCategories()]);
      } catch (error) {
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
  }, [
    loadCategories,
    loadExpenseTypes,
    loadLoans,
    loadTransactions,
    runWithLoading,
  ]);

  const resetTransactions = useCallback(async (): Promise<void> => {
    await runWithLoading(async () => {
      await database.resetTransactions();
      await Promise.all([
        loadCategories(), // Reload categories (balance direset ke 0)
        loadTransactions(), // Reload transactions (akan kosong)
        loadExpenseTypes(), // Reload expense types
      ]);
      // Reset monthlyStats karena semua data transaksi dan aggregate dihapus
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

  /**
   * ✅ NEW: Bersihkan riwayat transaksi tanpa mengubah saldo
   * Berbeda dengan resetTransactions yang juga reset saldo ke 0,
   * method ini HANYA hapus history transaksi, saldo & aggregate TETAP.
   *
   * Use case: User ingin hemat storage tapi tetap pertahankan saldo.
   */
  const clearTransactionHistory = useCallback(async (): Promise<number> => {
    let deletedCount = 0;
    await runWithLoading(async () => {
      deletedCount = await database.clearTransactionHistory();
      // Refresh data setelah cleanup
      await Promise.all([
        loadTransactions(), // Akan kosong setelah clear
        loadExpenseTypes(), // Expense type totals akan 0
      ]);
      // Kategori TIDAK perlu reload karena balance tidak berubah
      // Monthly stats TIDAK perlu reload karena aggregate tetap ada
    });
    return deletedCount;
  }, [loadExpenseTypes, loadTransactions, runWithLoading]);

  // Initialize notifications saat app pertama kali dibuka
  const handleInitializeNotifications = useCallback(async (): Promise<void> => {
    try {
      await initializeNotifications();
    } catch (error) {}
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
      transferCategoryBalance,

      // Optimized data loading
      loadAllData,

      // Expense Types
      expenseTypes,
      loadExpenseTypes,
      addExpenseType,
      updateExpenseType,
      deleteExpenseType,
      getExpenseTypeTotalsByMonth,

      // Transactions
      transactions,
      hasMoreTransactions, // ✅ PAGINATION
      loadTransactions,
      loadMoreTransactions, // ✅ PAGINATION
      addTransaction,
      addGlobalIncome,
      addMultiCategoryIncome,

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
      clearTransactionHistory, // ✅ NEW: Clear history only

      // Loading state
      loading,

      // App initialization
      initializeApp,
    }),
    [
      addCategory,
      addExpenseType,
      addGlobalIncome,
      addMultiCategoryIncome,
      addLoan,
      addTransaction,
      categories,
      cleanupLoanTransactions,
      clearTransactionHistory, // ✅ NEW
      deleteCategory,
      deleteExpenseType,
      deleteLoan,
      expenseTypes,
      getExpenseTypeTotalsByMonth,
      getLoanPayments,
      handleInitializeNotifications,
      hasMoreTransactions, // ✅ PAGINATION
      initializeApp,
      loadAllData,
      loadCategories,
      loadExpenseTypes,
      loadLoans,
      loadMonthlyStats,
      loadMoreTransactions, // ✅ PAGINATION
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
      transferCategoryBalance,
      updateCategory,
      updateExpenseType,
      updateLoanStatus,
    ]
  );

  // Cleanup notification listener saat AppProvider unmount
  // ⚠️ FIXED: Menggunakan useEffect cleanup (React Native compatible)
  useEffect(() => {
    return () => {
      cleanupNotificationListener();
    };
  }, []);

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
