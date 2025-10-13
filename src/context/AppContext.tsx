import React, { createContext, ReactNode, useContext, useState } from "react";
import { Category, database, Loan, Transaction } from "../db/database";

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

  // Statistics
  monthlyStats: { totalIncome: number; totalExpense: number };
  loadMonthlyStats: (year: number, month: number) => Promise<void>;

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
  });
  const [loading, setLoading] = useState(false);

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

  // Statistics methods
  const loadMonthlyStats = async (
    year: number,
    month: number
  ): Promise<void> => {
    try {
      const stats = await database.getMonthlyStats(year, month);
      setMonthlyStats(stats);
    } catch (error) {
      console.error("Error loading monthly stats:", error);
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

    // Statistics
    monthlyStats,
    loadMonthlyStats,

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
