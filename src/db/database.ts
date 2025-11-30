import * as SQLite from "expo-sqlite";

// Interface untuk tabel categories
export interface Category {
  id?: number;
  name: string;
  percentage: number;
  balance: number;
}

// Interface untuk tabel transactions
export interface Transaction {
  id?: number;
  type: "income" | "expense";
  amount: number;
  category_id: number;
  note: string;
  date: string;
  expense_type_id?: number | null;
  expense_type_name?: string | null;
}

// Interface untuk tabel loans
export interface Loan {
  id?: number;
  name: string;
  amount: number;
  category_id: number;
  status: "unpaid" | "half" | "paid";
  date: string;
  note?: string; // Catatan tujuan pinjaman
}

// Interface untuk tabel loan_payments (tracking pembayaran)
export interface LoanPayment {
  id?: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  remaining_amount: number;
}

// Interface untuk tabel expense_types
export interface ExpenseType {
  id?: number;
  name: string;
  total_spent: number;
}

// Interface untuk tabel monthly_aggregates (statistik bulanan persisten)
export interface MonthlyAggregate {
  id?: number;
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private expenseTypesHasCreatedAtCache: boolean | null = null;
  private isInitializing: boolean = false;

  async ensureInitialized(): Promise<void> {
    if (this.db && !this.isInitializing) {
      try {
        // Test koneksi database dengan query sederhana
        await this.db.getFirstAsync("SELECT 1");
        return;
      } catch (error) {
        console.warn("Database connection lost, reinitializing...", error);
        this.db = null;
      }
    }

    if (!this.db && !this.isInitializing) {
      await this.initializeDatabase();
    }
  }

  async initializeDatabase(): Promise<void> {
    if (this.isInitializing) {
      // Wait for existing initialization
      while (this.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isInitializing = true;
    try {
      this.db = await SQLite.openDatabaseAsync("catatku.db");

      // Buat tabel categories
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          percentage REAL NOT NULL,
          balance REAL NOT NULL DEFAULT 0
        );
      `);

      // Buat tabel transactions
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          amount REAL NOT NULL,
          category_id INTEGER NOT NULL,
          note TEXT,
          date TEXT NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );
      `);

      // Buat tabel expense_types
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS expense_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          total_spent REAL NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Pastikan kolom relasi jenis pengeluaran tersedia
      await this.ensureTransactionExpenseTypeColumn();
      await this.ensureExpenseTypeTotalsColumn();
      await this.ensureExpenseTypeCreatedAtColumn();

      // Buat tabel loans
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS loans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          category_id INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('unpaid', 'half', 'paid')),
          date TEXT NOT NULL,
          note TEXT,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );
      `);

      // Migration: Add note column jika belum ada (backward compatibility)
      const hasNoteColumn = await this.tableHasColumn("loans", "note");
      if (!hasNoteColumn) {
        await this.db.execAsync("ALTER TABLE loans ADD COLUMN note TEXT");
      }

      // Buat tabel monthly_aggregates untuk statistik bulanan yang persisten
      // Tabel ini TIDAK dihapus saat cleanup transaksi, agar statistik tetap ada
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS monthly_aggregates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          total_income REAL NOT NULL DEFAULT 0,
          total_expense REAL NOT NULL DEFAULT 0,
          UNIQUE(year, month)
        );
      `);

      // Buat tabel loan_payments untuk tracking pembayaran
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS loan_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          loan_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          payment_date TEXT NOT NULL,
          remaining_amount REAL NOT NULL,
          FOREIGN KEY (loan_id) REFERENCES loans (id)
        );
      `);

      // Buat index untuk performa
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_category_id ON transactions(category_id);
      `);

      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_date ON transactions(date);
      `);

      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_expense_type_id ON transactions(expense_type_id);
      `);

      // Insert kategori default jika belum ada
      await this.insertDefaultCategories();
      await this.insertDefaultExpenseTypes();
      await this.recalculateExpenseTypeTotals();

      // Populate monthly aggregates dari existing transactions (migration)
      // Harus dipanggil SETELAH tabel monthly_aggregates dibuat
      await this.populateMonthlyAggregatesFromTransactions();

      // Database initialized successfully - ready for production
    } catch (error) {
      console.error("Error initializing database:", error);
      this.db = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  // Insert kategori default sesuai prompt.md
  private async insertDefaultCategories(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      const existingCategories = await this.db.getAllAsync(
        "SELECT COUNT(*) as count FROM categories"
      );
      const count = (existingCategories[0] as { count: number }).count;

      if (count === 0) {
        const defaultCategories = [
          { name: "Sedekah", percentage: 10 },
          { name: "Uang tak terduga", percentage: 15 },
          { name: "Uang belanja", percentage: 40 },
          { name: "Tabungan", percentage: 15 },
          { name: "Operasional", percentage: 10 },
          { name: "Maintenance", percentage: 10 },
        ];

        for (const category of defaultCategories) {
          await this.db.runAsync(
            "INSERT INTO categories (name, percentage, balance) VALUES (?, ?, ?)",
            [category.name, category.percentage, 0]
          );
        }
        // Default categories inserted successfully
      }
    } catch (error) {
      console.error("Error inserting default categories:", error);
      throw error;
    }
  }

  private async tableHasColumn(
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const columns = (await this.db.getAllAsync(
      `PRAGMA table_info(${tableName})`
    )) as Array<{ name: string }>;

    return columns.some((column) => column.name === columnName);
  }

  private async ensureTransactionExpenseTypeColumn(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const hasColumn = await this.tableHasColumn(
      "transactions",
      "expense_type_id"
    );

    if (!hasColumn) {
      await this.db.execAsync(
        "ALTER TABLE transactions ADD COLUMN expense_type_id INTEGER"
      );
    }
  }

  private async ensureExpenseTypeTotalsColumn(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const hasColumn = await this.tableHasColumn("expense_types", "total_spent");

    if (!hasColumn) {
      await this.db.execAsync(
        "ALTER TABLE expense_types ADD COLUMN total_spent REAL NOT NULL DEFAULT 0"
      );
    }
  }

  private async ensureExpenseTypeCreatedAtColumn(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const hasColumn = await this.tableHasColumn("expense_types", "created_at");

    if (!hasColumn) {
      await this.db.execAsync(
        "ALTER TABLE expense_types ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"
      );
    }

    this.expenseTypesHasCreatedAtCache = true;
  }

  /**
   * Migration: Populate monthly_aggregates dari existing transactions.
   * Dipanggil sekali saat initialization untuk backward compatibility.
   */
  private async populateMonthlyAggregatesFromTransactions(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Cek apakah aggregate sudah pernah di-populate
      const existingCount = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM monthly_aggregates"
      );

      // Jika sudah ada data, skip migration
      if (existingCount && existingCount.count > 0) {
        return;
      }

      // Aggregate existing transactions per bulan
      const aggregates = await this.db.getAllAsync<{
        year: number;
        month: number;
        total_income: number;
        total_expense: number;
      }>(`
        SELECT 
          CAST(strftime('%Y', date) AS INTEGER) as year,
          CAST(strftime('%m', date) AS INTEGER) as month,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
        FROM transactions
        GROUP BY year, month
        ORDER BY year DESC, month DESC
      `);

      // Insert aggregates ke table
      if (aggregates.length > 0) {
        await this.db.withExclusiveTransactionAsync(async (txn) => {
          for (const agg of aggregates) {
            await txn.runAsync(
              `INSERT INTO monthly_aggregates (year, month, total_income, total_expense)
               VALUES (?, ?, ?, ?)`,
              [agg.year, agg.month, agg.total_income, agg.total_expense]
            );
          }
        });
        console.log(
          `[MIGRATION] Populated ${aggregates.length} monthly aggregates from existing transactions`
        );
      }
    } catch (error) {
      console.error("Error populating monthly aggregates:", error);
      // Silent failure - migration tidak critical
    }
  }

  private async expenseTypesHasCreatedAt(): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    if (this.expenseTypesHasCreatedAtCache === null) {
      this.expenseTypesHasCreatedAtCache = await this.tableHasColumn(
        "expense_types",
        "created_at"
      );
    }

    return this.expenseTypesHasCreatedAtCache;
  }

  private async insertDefaultExpenseTypes(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      const existingTypes = await this.db.getAllAsync(
        "SELECT COUNT(*) as count FROM expense_types"
      );
      const count = (existingTypes[0] as { count: number }).count;

      if (count === 0) {
        const defaultTypes = [
          "Makan",
          "Minum",
          "Transportasi",
          "Pendidikan",
          "Fashion",
          "Liburan",
        ];

        for (const typeName of defaultTypes) {
          await this.insertExpenseTypeRow(typeName, 0);
        }
      }
    } catch (error) {
      console.error("Error inserting default expense types:", error);
      throw error;
    }
  }

  private async insertExpenseTypeRow(
    name: string,
    totalSpent: number
  ): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");

    const hasCreatedAt = await this.expenseTypesHasCreatedAt();
    const now = new Date().toISOString();
    const query = hasCreatedAt
      ? "INSERT INTO expense_types (name, total_spent, created_at) VALUES (?, ?, ?)"
      : "INSERT INTO expense_types (name, total_spent) VALUES (?, ?)";
    const params = hasCreatedAt ? [name, totalSpent, now] : [name, totalSpent];

    const result = await this.db.runAsync(query, params);
    return result.lastInsertRowId;
  }

  // CRUD untuk Categories
  async getAllCategories(): Promise<Category[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.getAllAsync(
        "SELECT * FROM categories ORDER BY name"
      );
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  }

  async addCategory(category: Omit<Category, "id">): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      const result = await this.db.runAsync(
        "INSERT INTO categories (name, percentage, balance) VALUES (?, ?, ?)",
        [category.name, category.percentage, category.balance]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }

  async updateCategory(
    id: number,
    category: Omit<Category, "id">
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.runAsync(
        "UPDATE categories SET name = ?, percentage = ?, balance = ? WHERE id = ?",
        [category.name, category.percentage, category.balance, id]
      );
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }

  async transferCategoryBalance(
    sourceCategoryId: number,
    targetCategoryId: number,
    amount: number
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    if (sourceCategoryId === targetCategoryId) {
      throw new Error("Kategori sumber dan tujuan tidak boleh sama");
    }
    if (amount <= 0) {
      throw new Error("Jumlah transfer harus lebih dari 0");
    }

    await this.db.withExclusiveTransactionAsync(async (txn) => {
      const source = (await txn.getFirstAsync(
        "SELECT balance FROM categories WHERE id = ?",
        [sourceCategoryId]
      )) as { balance: number } | undefined;

      if (!source) {
        throw new Error("Kategori sumber tidak ditemukan");
      }

      const targetExists = await txn.getFirstAsync(
        "SELECT 1 FROM categories WHERE id = ?",
        [targetCategoryId]
      );

      if (!targetExists) {
        throw new Error("Kategori tujuan tidak ditemukan");
      }

      if (source.balance < amount) {
        throw new Error("Saldo kategori sumber tidak mencukupi");
      }

      await txn.runAsync(
        "UPDATE categories SET balance = balance - ? WHERE id = ?",
        [amount, sourceCategoryId]
      );

      await txn.runAsync(
        "UPDATE categories SET balance = balance + ? WHERE id = ?",
        [amount, targetCategoryId]
      );
    });
  }

  // CRUD untuk Expense Types
  async getExpenseTypes(): Promise<ExpenseType[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.ensureExpenseTypeCreatedAtColumn();
      await this.ensureExpenseTypeTotalsColumn();
      await this.recalculateExpenseTypeTotals();
      return await this.db.getAllAsync(
        "SELECT id, name, total_spent FROM expense_types ORDER BY name"
      );
    } catch (error) {
      console.error("Error getting expense types:", error);
      throw error;
    }
  }

  async addExpenseType(name: string): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.insertExpenseTypeRow(name.trim(), 0);
    } catch (error) {
      console.error("Error adding expense type:", error);
      throw error;
    }
  }

  async updateExpenseType(id: number, name: string): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.runAsync("UPDATE expense_types SET name = ? WHERE id = ?", [
        name.trim(),
        id,
      ]);
    } catch (error) {
      console.error("Error updating expense type:", error);
      throw error;
    }
  }

  async deleteExpenseType(id: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
          "UPDATE transactions SET expense_type_id = NULL WHERE expense_type_id = ?",
          [id]
        );
        await txn.runAsync("DELETE FROM expense_types WHERE id = ?", [id]);
      });
    } catch (error) {
      console.error("Error deleting expense type:", error);
      throw error;
    }
  }

  async recalculateExpenseTypeTotals(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.ensureExpenseTypeTotalsColumn();
      await this.db.execAsync(`
        UPDATE expense_types
        SET total_spent = COALESCE((
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.expense_type_id = expense_types.id
            AND t.type = 'expense'
        ), 0)
      `);
    } catch (error) {
      console.error("Error recalculating expense type totals:", error);
      throw error;
    }
  }

  // CRUD untuk Transactions
  async getTransactions(
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.getAllAsync(
        `SELECT
          t.*,
          et.name as expense_type_name
        FROM transactions t
        LEFT JOIN expense_types et ON et.id = t.expense_type_id
        ORDER BY t.date DESC, t.id DESC
        LIMIT ? OFFSET ?`,
        [limit, offset]
      );
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }
  }

  async addTransaction(transaction: Omit<Transaction, "id">): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      let insertedId = 0;
      await this.db.withExclusiveTransactionAsync(async (txn) => {
        const result = await txn.runAsync(
          "INSERT INTO transactions (type, amount, category_id, note, date, expense_type_id) VALUES (?, ?, ?, ?, ?, ?)",
          [
            transaction.type,
            transaction.amount,
            transaction.category_id,
            transaction.note,
            transaction.date,
            transaction.expense_type_id ?? null,
          ]
        );
        insertedId = result.lastInsertRowId;

        if (transaction.type === "income") {
          await txn.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        } else {
          await txn.runAsync(
            "UPDATE categories SET balance = balance - ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        }

        if (
          transaction.type === "expense" &&
          transaction.expense_type_id !== undefined &&
          transaction.expense_type_id !== null
        ) {
          await txn.runAsync(
            "UPDATE expense_types SET total_spent = total_spent + ? WHERE id = ?",
            [transaction.amount, transaction.expense_type_id]
          );
        }
      });

      // Update aggregate untuk statistik bulanan persisten
      const txDate = new Date(transaction.date);
      await this.updateMonthlyAggregate(
        txDate.getFullYear(),
        txDate.getMonth() + 1,
        transaction.type === "income" ? transaction.amount : 0,
        transaction.type === "expense" ? transaction.amount : 0
      );

      return insertedId;
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  }

  // Implementasi pembagian otomatis untuk pemasukan global
  async addGlobalIncome(
    amount: number,
    note: string = "Pemasukan Global"
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      const categories = await this.getAllCategories();

      // Validasi: pastikan ada kategori
      if (categories.length === 0) {
        throw new Error(
          "Tidak ada kategori. Buat kategori terlebih dahulu sebelum menambahkan transaksi."
        );
      }

      const date = new Date().toISOString();
      const dateObj = new Date(date);

      // Bagi pemasukan ke semua kategori berdasarkan persentase
      await this.db.withExclusiveTransactionAsync(async (txn) => {
        for (const category of categories) {
          const categoryAmount = (amount * category.percentage) / 100;

          await txn.runAsync(
            "INSERT INTO transactions (type, amount, category_id, note, date, expense_type_id) VALUES (?, ?, ?, ?, ?, ?)",
            [
              "income",
              categoryAmount,
              category.id!,
              `${note} (${category.percentage}%)`,
              date,
              null,
            ]
          );

          await txn.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [categoryAmount, category.id!]
          );
        }
      });

      // Update aggregate untuk statistik persisten
      await this.updateMonthlyAggregate(
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        amount, // Total income
        0 // No expense
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Menambah pemasukan ke beberapa kategori tertentu berdasarkan persentase mereka
   */
  async addMultiCategoryIncome(
    amount: number,
    categoryIds: number[],
    note: string = "Pemasukan Multi Kategori"
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    if (!categoryIds.length)
      throw new Error("At least one category must be selected");

    try {
      // Ambil kategori yang dipilih beserta persentasenya
      const categories = await this.getAllCategories();

      // Validasi: pastikan ada kategori
      if (categories.length === 0) {
        throw new Error(
          "Tidak ada kategori. Buat kategori terlebih dahulu sebelum menambahkan transaksi."
        );
      }
      const selectedCategories = categories.filter((cat) =>
        categoryIds.includes(cat.id!)
      );

      if (selectedCategories.length !== categoryIds.length) {
        throw new Error("Some selected categories not found");
      }

      // Hitung total persentase dari kategori yang dipilih
      const totalSelectedPercentage = selectedCategories.reduce(
        (sum, cat) => sum + cat.percentage,
        0
      );

      if (totalSelectedPercentage === 0) {
        throw new Error("Selected categories have no allocation percentage");
      }

      const date = new Date().toISOString();
      const dateObj = new Date(date);

      // Distribusikan pemasukan berdasarkan proporsi persentase kategori yang dipilih
      await this.db.withExclusiveTransactionAsync(async (txn) => {
        for (const category of selectedCategories) {
          // Hitung proporsi kategori ini dari total kategori yang dipilih
          const proportion = category.percentage / totalSelectedPercentage;
          const categoryAmount = amount * proportion;

          await txn.runAsync(
            "INSERT INTO transactions (type, amount, category_id, note, date, expense_type_id) VALUES (?, ?, ?, ?, ?, ?)",
            [
              "income",
              categoryAmount,
              category.id!,
              `${note} (${category.percentage}% dari ${selectedCategories.length} kategori)`,
              date,
              null,
            ]
          );

          await txn.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [categoryAmount, category.id!]
          );
        }
      });

      // Update aggregate untuk statistik persisten
      await this.updateMonthlyAggregate(
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        amount, // Total income
        0 // No expense
      );
    } catch (error) {
      throw error;
    }
  }

  // CRUD untuk Loans
  async getAllLoans(): Promise<Loan[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.getAllAsync(
        "SELECT * FROM loans ORDER BY date DESC"
      );
    } catch (error) {
      console.error("Error getting loans:", error);
      throw error;
    }
  }

  async addLoan(loan: Omit<Loan, "id">): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      let insertedId = 0;
      await this.db.withExclusiveTransactionAsync(async (txn) => {
        const result = await txn.runAsync(
          "INSERT INTO loans (name, amount, category_id, status, date, note) VALUES (?, ?, ?, ?, ?, ?)",
          [
            loan.name,
            loan.amount,
            loan.category_id,
            loan.status,
            loan.date,
            loan.note || null,
          ]
        );
        insertedId = result.lastInsertRowId;

        await txn.runAsync(
          "UPDATE categories SET balance = balance - ? WHERE id = ?",
          [loan.amount, loan.category_id]
        );
      });

      return insertedId;
    } catch (error) {
      console.error("Error adding loan:", error);
      throw error;
    }
  }

  async updateLoanStatus(
    id: number,
    status: "unpaid" | "half" | "paid",
    repaymentAmount?: number
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.withExclusiveTransactionAsync(async (txn) => {
        const loan = (await txn.getFirstAsync(
          "SELECT * FROM loans WHERE id = ?",
          [id]
        )) as Loan;

        if (!loan) throw new Error("Loan not found");

        let finalStatus = status;
        let finalRepaymentAmount = repaymentAmount || 0;

        if (
          status === "half" &&
          repaymentAmount &&
          repaymentAmount >= loan.amount
        ) {
          finalStatus = "paid";
          finalRepaymentAmount = loan.amount;
        }

        finalRepaymentAmount = Math.min(finalRepaymentAmount, loan.amount);
        const timestamp = new Date().toISOString();

        if (finalStatus === "paid") {
          await txn.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [loan.amount, loan.category_id]
          );

          await txn.runAsync(
            "INSERT INTO loan_payments (loan_id, amount, payment_date, remaining_amount) VALUES (?, ?, ?, ?)",
            [id, loan.amount, timestamp, 0]
          );

          await txn.runAsync(
            "UPDATE loans SET status = ?, amount = 0 WHERE id = ?",
            [finalStatus, id]
          );
        } else if (finalStatus === "half" && finalRepaymentAmount > 0) {
          await txn.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [finalRepaymentAmount, loan.category_id]
          );

          const newLoanAmount = loan.amount - finalRepaymentAmount;

          await txn.runAsync(
            "INSERT INTO loan_payments (loan_id, amount, payment_date, remaining_amount) VALUES (?, ?, ?, ?)",
            [id, finalRepaymentAmount, timestamp, newLoanAmount]
          );

          await txn.runAsync(
            "UPDATE loans SET status = ?, amount = ? WHERE id = ?",
            [finalStatus, newLoanAmount, id]
          );
        } else {
          await txn.runAsync("UPDATE loans SET status = ? WHERE id = ?", [
            finalStatus,
            id,
          ]);
        }
      });
    } catch (error) {
      console.error("Error updating loan status:", error);
      throw error;
    }
  }

  async deleteLoan(id: number): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.runAsync("DELETE FROM loans WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting loan:", error);
      throw error;
    }
  }

  // Utility functions untuk statistik
  /**
   * Update atau insert aggregate bulanan.
   * Dipanggil setiap kali ada transaksi baru untuk menjaga konsistensi.
   */
  private async updateMonthlyAggregate(
    year: number,
    month: number,
    incomeAmount: number,
    expenseAmount: number
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Coba update existing aggregate
      const result = await this.db.runAsync(
        `UPDATE monthly_aggregates 
         SET total_income = total_income + ?, 
             total_expense = total_expense + ?
         WHERE year = ? AND month = ?`,
        [incomeAmount, expenseAmount, year, month]
      );

      // Jika tidak ada row yang di-update, insert baru
      if (result.changes === 0) {
        await this.db.runAsync(
          `INSERT INTO monthly_aggregates (year, month, total_income, total_expense)
           VALUES (?, ?, ?, ?)`,
          [year, month, incomeAmount, expenseAmount]
        );
      }
    } catch (error) {
      console.error("Error updating monthly aggregate:", error);
      // Silent failure - aggregate adalah fitur tambahan
    }
  }

  /**
   * Get statistik bulanan dari transactions table.
   * Jika tidak ada transaksi (karena cleanup), fallback ke aggregate table.
   */
  async getMonthlyStats(
    year: number,
    month: number
  ): Promise<{ totalIncome: number; totalExpense: number }> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

      // Coba ambil dari transactions table dulu
      const result = (await this.db.getFirstAsync(
        `SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
        FROM transactions 
        WHERE date BETWEEN ? AND ?`,
        [startDate, endDate]
      )) as { totalIncome: number; totalExpense: number };

      // Jika ada data transaksi, return
      if (result.totalIncome > 0 || result.totalExpense > 0) {
        return {
          totalIncome: result.totalIncome,
          totalExpense: result.totalExpense,
        };
      }

      // Jika tidak ada transaksi (mungkin karena cleanup), ambil dari aggregate
      const aggregate = (await this.db.getFirstAsync(
        `SELECT total_income as totalIncome, total_expense as totalExpense
         FROM monthly_aggregates
         WHERE year = ? AND month = ?`,
        [year, month]
      )) as { totalIncome: number; totalExpense: number } | null;

      if (aggregate) {
        return {
          totalIncome: aggregate.totalIncome,
          totalExpense: aggregate.totalExpense,
        };
      }

      // Fallback jika tidak ada data sama sekali
      return {
        totalIncome: 0,
        totalExpense: 0,
      };
    } catch (error) {
      console.error("Error getting monthly stats:", error);
      throw error;
    }
  }

  async getExpenseTypeTotalsByMonth(
    year: number,
    month: number
  ): Promise<ExpenseType[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      const monthStr = month.toString().padStart(2, "0");
      const yearStr = year.toString();

      return await this.db.getAllAsync(
        `
        SELECT
          et.id,
          et.name,
          COALESCE(SUM(t.amount), 0) AS total_spent
        FROM expense_types et
        LEFT JOIN transactions t
          ON t.expense_type_id = et.id
          AND t.type = 'expense'
          AND strftime('%Y', t.date) = ?
          AND strftime('%m', t.date) = ?
        GROUP BY et.id, et.name
        ORDER BY total_spent DESC, et.name ASC
      `,
        [yearStr, monthStr]
      );
    } catch (error) {
      console.error("Error getting expense type totals by month:", error);
      throw error;
    }
  }

  async getTotalIncome(): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      const result = (await this.db.getFirstAsync(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "income"'
      )) as { total: number };
      return result.total;
    } catch (error) {
      console.error("Error getting total income:", error);
      throw error;
    }
  }

  // Loan Payment History methods
  async getLoanPayments(loanId: number): Promise<LoanPayment[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.getAllAsync(
        "SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY payment_date DESC",
        [loanId]
      );
    } catch (error) {
      console.error("Error getting loan payments:", error);
      throw error;
    }
  }

  async getAllLoanPayments(): Promise<LoanPayment[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.getAllAsync(
        "SELECT * FROM loan_payments ORDER BY payment_date DESC"
      );
    } catch (error) {
      console.error("Error getting all loan payments:", error);
      throw error;
    }
  }

  // Reset functions untuk membersihkan data
  async resetAllData(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execAsync("DELETE FROM transactions");
      await this.db.execAsync("DELETE FROM loan_payments");
      await this.db.execAsync("DELETE FROM loans");
      await this.db.execAsync("UPDATE categories SET balance = 0");
      await this.recalculateExpenseTypeTotals();
    } catch (error) {
      console.error("Error resetting all data:", error);
      throw error;
    }
  }

  /**
   * Reset riwayat transaksi SAJA (history record).
   * TIDAK mengubah saldo kategori - saldo tetap seperti terakhir.
   * Hanya menghapus record transaksi untuk membersihkan history.
   */
  async resetTransactions(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      // Hanya hapus riwayat transaksi, JANGAN reset saldo kategori
      await this.db.execAsync("DELETE FROM transactions");

      // Recalculate expense type totals (karena transaksi dihapus)
      await this.recalculateExpenseTypeTotals();

      console.log("[RESET] Transaction history cleared (balances preserved)");
    } catch (error) {
      console.error("Error resetting transactions:", error);
      throw error;
    }
  }

  async resetLoans(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execAsync("DELETE FROM loan_payments");
      await this.db.execAsync("DELETE FROM loans");
    } catch (error) {
      console.error("Error resetting loans:", error);
      throw error;
    }
  }

  async resetCategories(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execAsync("DELETE FROM categories");
    } catch (error) {
      console.error("Error resetting categories:", error);
      throw error;
    }
  }

  async resetCategoryBalances(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execAsync("UPDATE categories SET balance = 0");
    } catch (error) {
      console.error("Error resetting category balances:", error);
      throw error;
    }
  }

  // Membersihkan transaksi pinjaman yang tidak seharusnya ada
  async cleanupLoanTransactions(): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");
    try {
      // Hapus semua transaksi yang berkaitan dengan pinjaman
      await this.db.runAsync(
        "DELETE FROM transactions WHERE note LIKE '%pembayaran pinjaman%' OR note LIKE '%loan payment%'"
      );
      // Loan-related transactions cleaned up successfully
      await this.recalculateExpenseTypeTotals();
    } catch (error) {
      console.error("Error cleaning up loan transactions:", error);
      throw error;
    }
  }

  /**
   * 🧪 TESTING ONLY: Cleanup transaksi berdasarkan threshold MENIT
   * Untuk testing mekanisme cleanup dengan threshold yang lebih kecil
   */
  async cleanupOldTransactionsByMinutes(
    thresholdMinutes: number = 1
  ): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Hitung cutoff date (X menit yang lalu dari sekarang)
      const cutoffDate = new Date();
      cutoffDate.setMinutes(cutoffDate.getMinutes() - thresholdMinutes);
      const cutoffStr = cutoffDate.toISOString();

      console.log(`[CLEANUP TEST] Cutoff time: ${cutoffStr}`);

      // Hitung berapa transaksi yang akan dihapus
      const countResult = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM transactions WHERE date < ?",
        [cutoffStr]
      );

      const deletedCount = countResult?.count || 0;
      console.log(
        `[CLEANUP TEST] Found ${deletedCount} transactions to delete`
      );

      if (deletedCount > 0) {
        console.log(
          `[CLEANUP TEST] Deleting ${deletedCount} transactions older than ${thresholdMinutes} minutes`
        );

        // Hapus HANYA record transaksi, JANGAN ubah balance kategori
        // Balance kategori adalah saldo berjalan yang harus tetap seperti semula
        await this.db.runAsync("DELETE FROM transactions WHERE date < ?", [
          cutoffStr,
        ]);

        // Recalculate expense type totals untuk konsistensi
        await this.recalculateExpenseTypeTotals();

        console.log(
          `[CLEANUP TEST] Successfully deleted ${deletedCount} transaction records (balances preserved)`
        );
      }

      return deletedCount;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal membersihkan transaksi lama";
      console.error("[CLEANUP TEST] Error:", errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Membersihkan transaksi lama yang melebihi threshold bulan.
   * Method ini aman dipanggil kapan saja karena:
   * - Tidak mengubah struktur tabel
   * - Tidak mengubah balance kategori (balance sudah final dari transaksi lama)
   * - Hanya menghapus record transaksi history untuk hemat storage
   *
   * @param thresholdMonths Jumlah bulan untuk menyimpan transaksi (default: 3 bulan)
   * @returns Promise<number> Jumlah transaksi yang dihapus
   */
  async cleanupOldTransactions(thresholdMonths: number = 3): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    try {
      // Hitung cutoff date (3 bulan yang lalu dari sekarang)
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - thresholdMonths);
      const cutoffStr = cutoffDate.toISOString().split("T")[0];

      // Hitung berapa transaksi yang akan dihapus
      const countResult = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM transactions WHERE date < ?",
        [cutoffStr]
      );

      const deletedCount = countResult?.count || 0;

      if (deletedCount > 0) {
        console.log(
          `[CLEANUP] Deleting ${deletedCount} transactions older than ${thresholdMonths} months (cutoff: ${cutoffStr})`
        );

        // Hapus HANYA record transaksi, JANGAN ubah balance kategori
        // Balance kategori adalah saldo berjalan yang harus tetap seperti semula
        await this.db.runAsync("DELETE FROM transactions WHERE date < ?", [
          cutoffStr,
        ]);

        // Recalculate expense type totals untuk konsistensi
        await this.recalculateExpenseTypeTotals();

        console.log(
          `[CLEANUP] Successfully deleted ${deletedCount} old transaction records (balances preserved)`
        );
      }

      return deletedCount;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal membersihkan transaksi lama";
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const database = new Database();
