import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  adjustCategoryBalance,
  createCategory as createCategoryDb,
  deleteCategory as deleteCategoryDb,
  deleteLoan as deleteLoanDb,
  getAllCategories,
  getCategoryAggregates as getCategoryAggregatesDb,
  getLoans as getLoansDb,
  getTransactionSummary,
  getTransactions,
  getTransactionsCount,
  initializeDatabase,
  insertLoan,
  insertTransaction,
  updateCategory as updateCategoryDb,
  updateLoanStatus,
  withTransaction,
  type CategoryAggregate,
  type CategoryRecord,
  type LoanRecord,
  type TransactionRecord,
  type TransactionSummary,
} from "@/src/db/database";
import {
  endOfMonth,
  getPreviousMonth,
  startOfMonth,
  toISODate,
  toISOEndOfDay,
  toISOStartOfDay,
} from "@/src/utils/dateHelper";

export type Category = CategoryRecord;
export type Transaction = TransactionRecord;
export type TransactionType = Transaction["type"];
export type Loan = LoanRecord;
export type LoanStatus = Loan["status"];

type TransactionPeriod = "this-month" | "last-month" | "all";

interface TransactionFilter {
  period: TransactionPeriod;
  search: string;
}

interface TransactionPagination {
  offset: number;
  hasMore: boolean;
  loading: boolean;
}

interface IncomePayload {
  amount: number;
  note?: string;
  date?: Date;
}

interface CategoryIncomePayload extends IncomePayload {
  categoryId: number;
}

interface ExpensePayload {
  categoryId: number;
  amount: number;
  note?: string;
  date?: Date;
}

interface LoanPayload {
  name: string;
  amount: number;
  categoryId: number;
  date?: Date;
}

export interface AppContextValue {
  loading: boolean;
  categories: Category[];
  transactions: Transaction[];
  loans: Loan[];
  transactionSummary: TransactionSummary;
  categoryAggregates: CategoryAggregate[];
  transactionFilter: TransactionFilter;
  transactionsPagination: TransactionPagination;
  refreshAll: () => Promise<void>;
  reloadTransactions: () => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  setTransactionFilter: (update: Partial<TransactionFilter>) => void;
  addCategory: (payload: { name: string; percentage: number }) => Promise<void>;
  updateCategory: (id: number, payload: { name: string; percentage: number }) => Promise<void>;
  removeCategory: (id: number) => Promise<void>;
  addGlobalIncome: (payload: IncomePayload) => Promise<void>;
  addCategoryIncome: (payload: CategoryIncomePayload) => Promise<void>;
  addExpense: (payload: ExpensePayload) => Promise<void>;
  addLoan: (payload: LoanPayload) => Promise<void>;
  payLoanHalf: (loanId: number) => Promise<void>;
  payLoanFull: (loanId: number) => Promise<void>;
  deleteLoan: (loanId: number) => Promise<void>;
}

const PAGE_SIZE = 20;

const AppContext = createContext<AppContextValue | undefined>(undefined);

function getPeriodRange(period: TransactionPeriod): { startDate?: string; endDate?: string } {
  const today = new Date();
  if (period === "this-month") {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    return {
      startDate: toISOStartOfDay(start),
      endDate: toISOEndOfDay(end),
    };
  }
  if (period === "last-month") {
    const { start, end } = getPreviousMonth(today);
    return {
      startDate: toISOStartOfDay(start),
      endDate: toISOEndOfDay(end),
    };
  }
  return {};
}

export function AppProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary>({
    income: 0,
    expense: 0,
  });
  const [categoryAggregates, setCategoryAggregates] = useState<CategoryAggregate[]>([]);
  const [transactionFilter, setTransactionFilterState] = useState<TransactionFilter>({
    period: "this-month",
    search: "",
  });
  const [transactionsPagination, setTransactionsPagination] = useState<TransactionPagination>({
    offset: 0,
    hasMore: true,
    loading: false,
  });

  const isInitializedRef = useRef(false);

  const loadCategories = useCallback(async () => {
    const data = await getAllCategories();
    setCategories(data);
  }, []);

  const loadLoans = useCallback(async () => {
    const data = await getLoansDb();
    setLoans(data);
  }, []);

  const fetchTransactions = useCallback(
    async (reset: boolean) => {
      const range = getPeriodRange(transactionFilter.period);
      const search = transactionFilter.search.trim();
      let baseOffset = 0;

      setTransactionsPagination((prev) => {
        baseOffset = reset ? 0 : prev.offset;
        return {
          offset: baseOffset,
          hasMore: reset ? true : prev.hasMore,
          loading: true,
        };
      });

      try {
        const rows = await getTransactions({
          ...range,
          search: search.length > 0 ? search : undefined,
          limit: PAGE_SIZE,
          offset: baseOffset,
        });

        setTransactions((prev) => (reset ? rows : [...prev, ...rows]));

        setTransactionsPagination({
          offset: baseOffset + rows.length,
          hasMore: rows.length === PAGE_SIZE,
          loading: false,
        });

        const summary = await getTransactionSummary({
          ...range,
          search: search.length > 0 ? search : undefined,
        });
        setTransactionSummary(summary);

        const aggregates = await getCategoryAggregatesDb(range);
        setCategoryAggregates(aggregates);
      } catch (error) {
        setTransactionsPagination((prev) => ({
          ...prev,
          loading: false,
        }));
        throw error;
      }
    },
    [transactionFilter],
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await initializeDatabase();
      await Promise.all([loadCategories(), loadLoans()]);
      await fetchTransactions(true);
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, loadCategories, loadLoans]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      refreshAll().catch((error) => {
        console.error("Gagal inisialisasi aplikasi:", error);
      });
      return;
    }
    fetchTransactions(true).catch((error) => {
      console.error("Gagal memuat transaksi:", error);
    });
  }, [transactionFilter, fetchTransactions, refreshAll]);

  const reloadTransactions = useCallback(async () => {
    await fetchTransactions(true);
  }, [fetchTransactions]);

  const loadMoreTransactions = useCallback(async () => {
    if (!transactionsPagination.hasMore || transactionsPagination.loading) {
      return;
    }
    await fetchTransactions(false);
  }, [fetchTransactions, transactionsPagination.hasMore, transactionsPagination.loading]);

  const setTransactionFilter = useCallback((update: Partial<TransactionFilter>) => {
    setTransactionFilterState((prev) => ({
      ...prev,
      ...update,
    }));
  }, []);

  const validatePercentageTotal = useCallback(
    (targetId: number | null, nextPercentage: number) => {
      if (nextPercentage < 0) {
        throw new Error("Persentase tidak boleh bernilai negatif.");
      }
      const sum = categories.reduce((acc, category) => {
        if (targetId !== null && category.id === targetId) {
          return acc;
        }
        return acc + category.percentage;
      }, 0);
      if (sum + nextPercentage > 100.0001) {
        throw new Error("Total persentase kategori tidak boleh melebihi 100%.");
      }
    },
    [categories],
  );

  const addCategory = useCallback(
    async ({ name, percentage }: { name: string; percentage: number }) => {
      validatePercentageTotal(null, percentage);
      await createCategoryDb({ name, percentage });
      await loadCategories();
      await fetchTransactions(true);
    },
    [fetchTransactions, loadCategories, validatePercentageTotal],
  );

  const updateCategory = useCallback(
    async (id: number, { name, percentage }: { name: string; percentage: number }) => {
      validatePercentageTotal(id, percentage);
      await updateCategoryDb(id, { name, percentage });
      await loadCategories();
      await fetchTransactions(true);
    },
    [fetchTransactions, loadCategories, validatePercentageTotal],
  );

  const removeCategory = useCallback(
    async (id: number) => {
      const relatedTransactions = await getTransactionsCount({ categoryId: id });
      if (relatedTransactions > 0) {
        throw new Error("Kategori tidak bisa dihapus karena masih ada transaksi terkait.");
      }
      const hasActiveLoan = loans.some((loan) => loan.categoryId === id && loan.status !== "paid");
      if (hasActiveLoan) {
        throw new Error("Kategori tidak bisa dihapus karena ada pinjaman yang belum lunas.");
      }
      await deleteCategoryDb(id);
      await loadCategories();
      await fetchTransactions(true);
    },
    [fetchTransactions, loadCategories, loans],
  );

  const addGlobalIncome = useCallback(
    async ({ amount, note, date }: IncomePayload) => {
      if (amount <= 0) {
        throw new Error("Jumlah pemasukan harus lebih dari 0.");
      }
      const activeCategories = categories.filter((category) => category.percentage > 0);
      if (activeCategories.length === 0) {
        throw new Error("Tidak ada kategori aktif untuk menerima pemasukan global.");
      }

      const totalPercentage = activeCategories.reduce(
        (acc, category) => acc + category.percentage,
        0,
      );
      if (totalPercentage <= 0) {
        throw new Error("Total persentase kategori harus lebih dari 0.");
      }

      const isoDate = toISODate(date ?? new Date());

      await withTransaction(async (tx) => {
        let remaining = amount;

        // Pembagian otomatis ke kategori sesuai persentase yang berlaku.
        for (let index = 0; index < activeCategories.length; index += 1) {
          const category = activeCategories[index];
          let nominal = Math.floor((amount * category.percentage) / totalPercentage);
          const isLast = index === activeCategories.length - 1;
          if (isLast) {
            nominal = remaining;
          } else if (nominal > remaining) {
            nominal = remaining;
          }
          remaining -= nominal;

          if (nominal <= 0) {
            continue;
          }

          await adjustCategoryBalance(category.id, nominal, tx);
          await insertTransaction(
            {
              type: "income",
              amount: nominal,
              categoryId: category.id,
              note: note ?? "Pemasukan global",
              date: isoDate,
            },
            tx,
          );
        }
      });

      await Promise.all([loadCategories(), fetchTransactions(true)]);
    },
    [categories, fetchTransactions, loadCategories],
  );

  const addCategoryIncome = useCallback(
    async ({ categoryId, amount, note, date }: CategoryIncomePayload) => {
      if (amount <= 0) {
        throw new Error("Jumlah pemasukan harus lebih dari 0.");
      }
      const category = categories.find((item) => item.id === categoryId);
      if (!category) {
        throw new Error("Kategori tidak ditemukan.");
      }

      const isoDate = toISODate(date ?? new Date());

      await withTransaction(async (tx) => {
        await adjustCategoryBalance(categoryId, amount, tx);
        await insertTransaction(
          {
            type: "income",
            amount,
            categoryId,
            note: note ?? `Pemasukan ke ${category.name}`,
            date: isoDate,
          },
          tx,
        );
      });

      await Promise.all([loadCategories(), fetchTransactions(true)]);
    },
    [categories, fetchTransactions, loadCategories],
  );

  const addExpense = useCallback(
    async ({ categoryId, amount, note, date }: ExpensePayload) => {
      if (amount <= 0) {
        throw new Error("Jumlah pengeluaran harus lebih dari 0.");
      }
      const category = categories.find((item) => item.id === categoryId);
      if (!category) {
        throw new Error("Kategori tidak ditemukan.");
      }
      if (amount > category.balance) {
        throw new Error("Saldo kategori tidak mencukupi untuk pengeluaran ini.");
      }

      const isoDate = toISODate(date ?? new Date());

      await withTransaction(async (tx) => {
        await adjustCategoryBalance(categoryId, -amount, tx);
        await insertTransaction(
          {
            type: "expense",
            amount,
            categoryId,
            note: note ?? `Pengeluaran dari ${category.name}`,
            date: isoDate,
          },
          tx,
        );
      });

      await Promise.all([loadCategories(), fetchTransactions(true)]);
    },
    [categories, fetchTransactions, loadCategories],
  );

  const addLoan = useCallback(
    async ({ name, amount, categoryId, date }: LoanPayload) => {
      if (amount <= 0) {
        throw new Error("Jumlah pinjaman harus lebih dari 0.");
      }
      const category = categories.find((item) => item.id === categoryId);
      if (!category) {
        throw new Error("Kategori tidak ditemukan.");
      }
      if (amount > category.balance) {
        throw new Error("Saldo kategori tidak cukup untuk dicairkan sebagai pinjaman.");
      }

      const isoDate = toISODate(date ?? new Date());

      await withTransaction(async (tx) => {
        await adjustCategoryBalance(categoryId, -amount, tx);
        await insertLoan(
          {
            name,
            amount,
            categoryId,
            status: "unpaid",
            date: isoDate,
          },
          tx,
        );
        await insertTransaction(
          {
            type: "expense",
            amount,
            categoryId,
            note: `Pinjaman untuk ${name}`,
            date: isoDate,
          },
          tx,
        );
      });

      await Promise.all([loadCategories(), loadLoans(), fetchTransactions(true)]);
    },
    [categories, fetchTransactions, loadCategories, loadLoans],
  );

  const payLoanHalf = useCallback(
    async (loanId: number) => {
      const loan = loans.find((item) => item.id === loanId);
      if (!loan) {
        throw new Error("Data pinjaman tidak ditemukan.");
      }
      if (loan.status !== "unpaid") {
        throw new Error("Pinjaman ini tidak bisa dibayar setengah lagi.");
      }

      const refundAmount = loan.amount / 2;
      const isoDate = toISODate(new Date());

      await withTransaction(async (tx) => {
        await adjustCategoryBalance(loan.categoryId, refundAmount, tx);
        await updateLoanStatus(loan.id, "half", tx);
        await insertTransaction(
          {
            type: "income",
            amount: refundAmount,
            categoryId: loan.categoryId,
            note: `Pembayaran 50% pinjaman ${loan.name}`,
            date: isoDate,
          },
          tx,
        );
      });

      await Promise.all([loadCategories(), loadLoans(), fetchTransactions(true)]);
    },
    [fetchTransactions, loadCategories, loadLoans, loans],
  );

  const payLoanFull = useCallback(
    async (loanId: number) => {
      const loan = loans.find((item) => item.id === loanId);
      if (!loan) {
        throw new Error("Data pinjaman tidak ditemukan.");
      }
      if (loan.status === "paid") {
        throw new Error("Pinjaman sudah lunas.");
      }

      const refundAmount = loan.status === "half" ? loan.amount / 2 : loan.amount;
      const isoDate = toISODate(new Date());

      await withTransaction(async (tx) => {
        await adjustCategoryBalance(loan.categoryId, refundAmount, tx);
        await updateLoanStatus(loan.id, "paid", tx);
        await insertTransaction(
          {
            type: "income",
            amount: refundAmount,
            categoryId: loan.categoryId,
            note: `Pelunasan pinjaman ${loan.name}`,
            date: isoDate,
          },
          tx,
        );
      });

      await Promise.all([loadCategories(), loadLoans(), fetchTransactions(true)]);
    },
    [fetchTransactions, loadCategories, loadLoans, loans],
  );

  const deleteLoan = useCallback(
    async (loanId: number) => {
      await deleteLoanDb(loanId);
      await loadLoans();
    },
    [loadLoans],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      categories,
      transactions,
      loans,
      transactionSummary,
      categoryAggregates,
      transactionFilter,
      transactionsPagination,
      refreshAll,
      reloadTransactions,
      loadMoreTransactions,
      setTransactionFilter,
      addCategory,
      updateCategory,
      removeCategory,
      addGlobalIncome,
      addCategoryIncome,
      addExpense,
      addLoan,
      payLoanHalf,
      payLoanFull,
      deleteLoan,
    }),
    [
      categories,
      transactions,
      loans,
      transactionSummary,
      categoryAggregates,
      transactionFilter,
      transactionsPagination,
      refreshAll,
      reloadTransactions,
      loadMoreTransactions,
      setTransactionFilter,
      addCategory,
      updateCategory,
      removeCategory,
      addGlobalIncome,
      addCategoryIncome,
      addExpense,
      addLoan,
      payLoanHalf,
      payLoanFull,
      deleteLoan,
      loading,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext harus dipakai di dalam AppProvider");
  }
  return context;
}
