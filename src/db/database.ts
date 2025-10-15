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
}

// Interface untuk tabel loans
export interface Loan {
  id?: number;
  name: string;
  amount: number;
  category_id: number;
  status: "unpaid" | "half" | "paid";
  date: string;
}

// Interface untuk tabel loan_payments (tracking pembayaran)
export interface LoanPayment {
  id?: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  remaining_amount: number;
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
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

      // Buat tabel loans
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS loans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          category_id INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('unpaid', 'half', 'paid')),
          date TEXT NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories (id)
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

      // Insert kategori default jika belum ada
      await this.insertDefaultCategories();

      // Database initialized successfully - ready for production
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
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

  // CRUD untuk Categories
  async getAllCategories(): Promise<Category[]> {
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
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }

  // CRUD untuk Transactions
  async getTransactions(
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      return await this.db.getAllAsync(
        "SELECT * FROM transactions ORDER BY date DESC LIMIT ? OFFSET ?",
        [limit, offset]
      );
    } catch (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }
  }

  async addTransaction(transaction: Omit<Transaction, "id">): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const result = await this.db.runAsync(
        "INSERT INTO transactions (type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?)",
        [
          transaction.type,
          transaction.amount,
          transaction.category_id,
          transaction.note,
          transaction.date,
        ]
      );

      // Update saldo kategori
      if (transaction.type === "income") {
        await this.db.runAsync(
          "UPDATE categories SET balance = balance + ? WHERE id = ?",
          [transaction.amount, transaction.category_id]
        );
      } else {
        await this.db.runAsync(
          "UPDATE categories SET balance = balance - ? WHERE id = ?",
          [transaction.amount, transaction.category_id]
        );
      }

      return result.lastInsertRowId;
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
    if (!this.db) throw new Error("Database not initialized");
    try {
      const categories = await this.getAllCategories();
      const date = new Date().toISOString();

      // Bagi pemasukan ke semua kategori berdasarkan persentase
      for (const category of categories) {
        const categoryAmount = (amount * category.percentage) / 100;

        // Tambah transaksi
        await this.db.runAsync(
          "INSERT INTO transactions (type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?)",
          [
            "income",
            categoryAmount,
            category.id!,
            `${note} (${category.percentage}%)`,
            date,
          ]
        );

        // Update saldo kategori
        await this.db.runAsync(
          "UPDATE categories SET balance = balance + ? WHERE id = ?",
          [categoryAmount, category.id!]
        );
      }
    } catch (error) {
      console.error("Error adding global income:", error);
      throw error;
    }
  }

  // CRUD untuk Loans
  async getAllLoans(): Promise<Loan[]> {
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
    if (!this.db) throw new Error("Database not initialized");
    try {
      const result = await this.db.runAsync(
        "INSERT INTO loans (name, amount, category_id, status, date) VALUES (?, ?, ?, ?, ?)",
        [loan.name, loan.amount, loan.category_id, loan.status, loan.date]
      );

      // Kurangi saldo kategori saat membuat pinjaman
      // Ini BUKAN transaksi expense, hanya perpindahan uang yang sudah ada
      await this.db.runAsync(
        "UPDATE categories SET balance = balance - ? WHERE id = ?",
        [loan.amount, loan.category_id]
      );

      // TIDAK dicatat sebagai transaksi - pinjaman hanya history tersendiri

      return result.lastInsertRowId;
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
    if (!this.db) throw new Error("Database not initialized");
    try {
      const loan = (await this.db.getFirstAsync(
        "SELECT * FROM loans WHERE id = ?",
        [id]
      )) as Loan;

      if (!loan) throw new Error("Loan not found");

      // Logika otomatis: jika pembayaran >= jumlah pinjaman, set status menjadi "paid"
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

      // Kembalikan uang ke kategori sesuai status
      if (finalStatus === "paid") {
        // Lunas - kembalikan sisa jumlah pinjaman ke saldo kategori
        await this.db.runAsync(
          "UPDATE categories SET balance = balance + ? WHERE id = ?",
          [loan.amount, loan.category_id]
        );

        // TIDAK dicatat sebagai income transaction - ini hanya pengembalian uang yang sudah ada

        // Catat pembayaran ke history loan payments
        await this.db.runAsync(
          "INSERT INTO loan_payments (loan_id, amount, payment_date, remaining_amount) VALUES (?, ?, ?, ?)",
          [id, loan.amount, new Date().toISOString(), 0]
        );

        // Update status dan amount pinjaman menjadi 0
        await this.db.runAsync(
          "UPDATE loans SET status = ?, amount = 0 WHERE id = ?",
          [finalStatus, id]
        );
      } else if (finalStatus === "half" && finalRepaymentAmount > 0) {
        // Bayar sebagian - kembalikan sebagian uang ke saldo kategori
        await this.db.runAsync(
          "UPDATE categories SET balance = balance + ? WHERE id = ?",
          [finalRepaymentAmount, loan.category_id]
        );

        // TIDAK dicatat sebagai income transaction - ini hanya pengembalian sebagian uang yang sudah ada

        // Update amount pinjaman (kurangi dengan jumlah yang dibayar)
        const newLoanAmount = loan.amount - finalRepaymentAmount;

        // Catat pembayaran ke history loan payments
        await this.db.runAsync(
          "INSERT INTO loan_payments (loan_id, amount, payment_date, remaining_amount) VALUES (?, ?, ?, ?)",
          [id, finalRepaymentAmount, new Date().toISOString(), newLoanAmount]
        );

        // Update status dan amount pinjaman
        await this.db.runAsync(
          "UPDATE loans SET status = ?, amount = ? WHERE id = ?",
          [finalStatus, newLoanAmount, id]
        );
      } else {
        // Hanya update status tanpa perubahan lain
        await this.db.runAsync("UPDATE loans SET status = ? WHERE id = ?", [
          finalStatus,
          id,
        ]);
      }
    } catch (error) {
      console.error("Error updating loan status:", error);
      throw error;
    }
  }

  async deleteLoan(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.runAsync("DELETE FROM loans WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting loan:", error);
      throw error;
    }
  }

  // Utility functions untuk statistik
  async getMonthlyStats(
    year: number,
    month: number
  ): Promise<{ totalIncome: number; totalExpense: number }> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

      const incomeResult = (await this.db.getFirstAsync(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "income" AND date BETWEEN ? AND ?',
        [startDate, endDate]
      )) as { total: number };

      const expenseResult = (await this.db.getFirstAsync(
        'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = "expense" AND date BETWEEN ? AND ?',
        [startDate, endDate]
      )) as { total: number };

      return {
        totalIncome: incomeResult.total,
        totalExpense: expenseResult.total,
      };
    } catch (error) {
      console.error("Error getting monthly stats:", error);
      throw error;
    }
  }

  // Loan Payment History methods
  async getLoanPayments(loanId: number): Promise<LoanPayment[]> {
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
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execAsync("DELETE FROM transactions");
      await this.db.execAsync("DELETE FROM loan_payments");
      await this.db.execAsync("DELETE FROM loans");
      await this.db.execAsync("UPDATE categories SET balance = 0");
    } catch (error) {
      console.error("Error resetting all data:", error);
      throw error;
    }
  }

  async resetTransactions(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execAsync("DELETE FROM transactions");
      await this.db.execAsync("UPDATE categories SET balance = 0");
    } catch (error) {
      console.error("Error resetting transactions:", error);
      throw error;
    }
  }

  async resetLoans(): Promise<void> {
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
    if (!this.db) throw new Error("Database not initialized");
    try {
      await this.db.execAsync("DELETE FROM categories");
    } catch (error) {
      console.error("Error resetting categories:", error);
      throw error;
    }
  }

  async resetCategoryBalances(): Promise<void> {
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
    if (!this.db) throw new Error("Database not initialized");
    try {
      // Hapus semua transaksi yang berkaitan dengan pinjaman
      await this.db.runAsync(
        "DELETE FROM transactions WHERE note LIKE '%pembayaran pinjaman%' OR note LIKE '%loan payment%'"
      );
      // Loan-related transactions cleaned up successfully
    } catch (error) {
      console.error("Error cleaning up loan transactions:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const database = new Database();
