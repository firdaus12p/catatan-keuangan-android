import React, { createContext, ReactNode, useContext, useState } from "react";
import {
  Category,
  database,
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
  monthlyStats: {
    totalIncome: number;
    totalExpense: number;
    totalSaldo: number; // Total pemasukan yang tercatat bulan ini
    saldoBersih: number; // Saldo yang tersedia saat ini (dipengaruhi pinjaman)
    totalOutstandingLoans: number; // Total pinjaman yang belum lunas
  };
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalSaldo: 0, // Total pemasukan yang tercatat bulan ini
    saldoBersih: 0, // Saldo yang tersedia saat ini (dipengaruhi pinjaman)
    totalOutstandingLoans: 0, // Total pinjaman yang belum lunas
  });
  const [totalAllTimeBalance, setTotalAllTimeBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Helper function untuk membuat empty stats
  const createEmptyStats = () => ({
    totalIncome: 0,
    totalExpense: 0,
    totalSaldo: 0,
    saldoBersih: 0,
    totalOutstandingLoans: 0,
  });

  // Initialize database dan load data awal
  const initializeApp = async (): Promise<void> => {
    try {
      setLoading(true);
      await database.initializeDatabase();
      await loadCategories();
      await loadTransactions();
      await loadLoans();

      // Load statistik bulan ini
      const now = new Date();
      await loadMonthlyStats(now.getFullYear(), now.getMonth() + 1);

      // Initialize notifications
      await handleInitializeNotifications();
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setLoading(false);
    }
  };

  // Categories methods
  const loadCategories = async (): Promise<void> => {
    try {
      const data = await database.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const addCategory = async (category: Omit<Category, "id">): Promise<void> => {
    try {
      await database.addCategory(category);
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
      await database.updateCategory(id, category);
      await loadCategories(); // Refresh data
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  };

  const deleteCategory = async (id: number): Promise<void> => {
    try {
      await database.deleteCategory(id);
      await loadCategories(); // Refresh data
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };

  // Transactions methods
  const loadTransactions = async (
    limit: number = 50,
    offset: number = 0
  ): Promise<void> => {
    try {
      const data = await database.getTransactions(limit, offset);
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const addTransaction = async (
    transaction: Omit<Transaction, "id">
  ): Promise<void> => {
    try {
      await database.addTransaction(transaction);
      await loadTransactions(); // Refresh data
      await loadCategories(); // Refresh categories untuk update saldo

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
  };

  const addGlobalIncome = async (
    amount: number,
    note: string = "Pemasukan Global"
  ): Promise<void> => {
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
  };

  // Loans methods
  const loadLoans = async (): Promise<void> => {
    try {
      const data = await database.getAllLoans();
      setLoans(data);
    } catch (error) {
      console.error("Error loading loans:", error);
    }
  };

  const addLoan = async (loan: Omit<Loan, "id">): Promise<void> => {
    try {
      await database.addLoan(loan);
      await loadLoans(); // Refresh data
      await loadCategories(); // Refresh categories untuk update saldo
      await loadTransactions(); // Refresh transactions untuk update riwayat
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
      await database.updateLoanStatus(id, status, repaymentAmount);
      await loadLoans(); // Refresh data
      await loadCategories(); // Refresh categories untuk update saldo
      await loadTransactions(); // Refresh transactions untuk update riwayat
    } catch (error) {
      console.error("Error updating loan status:", error);
      throw error;
    }
  };

  const deleteLoan = async (id: number): Promise<void> => {
    try {
      await database.deleteLoan(id);
      await loadLoans(); // Refresh data
    } catch (error) {
      console.error("Error deleting loan:", error);
      throw error;
    }
  };

  // Loan Payments methods
  const getLoanPayments = async (loanId: number): Promise<LoanPayment[]> => {
    try {
      return await database.getLoanPayments(loanId);
    } catch (error) {
      console.error("Error getting loan payments:", error);
      throw error;
    }
  };

  // Statistics methods
  const loadMonthlyStats = async (
    year: number,
    month: number
  ): Promise<void> => {
    try {
      const stats = await database.getMonthlyStats(year, month);
      // Total Saldo = hanya total pemasukan yang tercatat (bukan income - expense)
      const totalSaldo = stats.totalIncome;

      // Calculate total outstanding loans
      const currentLoans = await database.getAllLoans();
      const totalOutstandingLoans = currentLoans
        .filter((loan) => loan.status !== "paid")
        .reduce((sum, loan) => sum + loan.amount, 0);

      // Saldo Bersih = saldo yang tersedia saat ini
      // Dihitung dari total semua kategori balance (yang sudah terpengaruh operasi pinjaman)
      const categories = await database.getAllCategories();
      const totalCategoryBalance = categories.reduce(
        (sum: number, cat: Category) => sum + cat.balance,
        0
      );
      const saldoBersih = totalCategoryBalance;

      setMonthlyStats({
        ...stats,
        totalSaldo,
        saldoBersih,
        totalOutstandingLoans,
      });
    } catch (error) {
      console.error("Error loading monthly stats:", error);
    }
  };

  const loadTotalAllTimeBalance = async (): Promise<void> => {
    try {
      // Total All-Time Balance = hanya total pemasukan semua bulan
      // Bukan pemasukan - pengeluaran, sesuai dengan konsep Total Saldo
      const allTransactions = await database.getTransactions(999999, 0);
      const totalAllTimeIncome = allTransactions
        .filter((t: Transaction) => t.type === "income")
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      setTotalAllTimeBalance(totalAllTimeIncome);
    } catch (error) {
      console.error("Error loading total all-time balance:", error);
    }
  };

  // Reset methods
  const resetAllData = async (): Promise<void> => {
    try {
      setLoading(true);
      await database.resetAllData();
      await loadCategories();
      await loadTransactions();
      await loadLoans();
      setMonthlyStats(createEmptyStats());
    } catch (error) {
      console.error("Error resetting all data:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetTransactions = async (): Promise<void> => {
    try {
      setLoading(true);
      await database.resetTransactions();
      await loadCategories();
      await loadTransactions();
      setMonthlyStats(createEmptyStats());
    } catch (error) {
      console.error("Error resetting transactions:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetLoans = async (): Promise<void> => {
    try {
      setLoading(true);
      await database.resetLoans();
      await loadLoans();
    } catch (error) {
      console.error("Error resetting loans:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      await database.resetCategories();
      await loadCategories();
      await loadTransactions();
      await loadLoans();
      setMonthlyStats(createEmptyStats());
    } catch (error) {
      console.error("Error resetting categories:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryBalances = async (): Promise<void> => {
    try {
      setLoading(true);
      await database.resetCategoryBalances();
      await loadCategories();
      setMonthlyStats(createEmptyStats());
    } catch (error) {
      console.error("Error resetting category balances:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cleanupLoanTransactions = async (): Promise<void> => {
    try {
      setLoading(true);
      await database.cleanupLoanTransactions();
      await loadTransactions();
      await loadCategories();
      // Reload monthly stats karena transactions berubah
      const now = new Date();
      await loadMonthlyStats(now.getFullYear(), now.getMonth() + 1);
    } catch (error) {
      console.error("Error cleaning up loan transactions:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Initialize notifications saat app pertama kali dibuka
  const handleInitializeNotifications = async (): Promise<void> => {
    try {
      await initializeNotifications();
      console.log("Notifications initialized successfully");
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  };

  const value: AppContextType = {
    // Categories
    categories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,

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
  };

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
