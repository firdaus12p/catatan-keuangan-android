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
  expense_type_id?: number;
  note: string;
  date: string;
}

// Interface untuk tabel expense_types
export interface ExpenseType {
  id?: number;
  name: string;
  color?: string;
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

// Interface untuk tabel loan_payments
export interface LoanPayment {
  id?: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  remaining_amount: number;
}

// Stats interfaces
export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
}

export interface ExpenseStats {
  expense_type_id: number | null;
  expense_type_name: string | null;
  color: string | null;
  total_amount: number;
}

// Database operation queue system
class DatabaseQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error("Queue operation failed:", error);
        }
      }
    }

    this.isProcessing = false;
  }
}

// Global database state
let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
const dbQueue = new DatabaseQueue();

// Initialize database with proper error handling
async function ensureDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db && isInitialized) {
    return db;
  }

  if (initializationPromise) {
    await initializationPromise;
    return db!;
  }

  initializationPromise = initializeDatabase();
  await initializationPromise;
  return db!;
}

async function initializeDatabase(): Promise<void> {
  try {
    console.log("🔄 Initializing fresh database...");

    // Close any existing connection
    if (db) {
      try {
        await db.closeAsync();
      } catch (error) {
        console.log(
          "Note: Error closing existing database (expected if not open)"
        );
      }
    }

    // Open database with a fresh name to avoid corruption
    const dbName = `catatan_keuangan_v${Date.now()}.db`;
    db = await SQLite.openDatabaseAsync(dbName);
    console.log("✅ Database opened:", dbName);

    // Set database pragma for better performance
    await db.execAsync("PRAGMA journal_mode=WAL;");
    await db.execAsync("PRAGMA foreign_keys=ON;");
    await db.execAsync("PRAGMA synchronous=NORMAL;");

    await createTables();
    await insertDefaultData();

    isInitialized = true;
    console.log("🎉 Database initialization completed!");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    db = null;
    isInitialized = false;
    initializationPromise = null;
    throw error;
  }
}

async function createTables(): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  console.log("📋 Creating tables...");

  // Create all tables in a single transaction
  await db.execAsync(`
    BEGIN TRANSACTION;
    
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      percentage REAL NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expense_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6200EE'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      expense_type_id INTEGER,
      note TEXT,
      date TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (expense_type_id) REFERENCES expense_types (id)
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'half', 'paid')),
      date TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS loan_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      remaining_amount REAL NOT NULL,
      FOREIGN KEY (loan_id) REFERENCES loans (id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_expense_type_id ON transactions(expense_type_id);
    CREATE INDEX IF NOT EXISTS idx_loans_category_id ON loans(category_id);
    
    COMMIT;
  `);

  console.log("✅ All tables created successfully");
}

async function insertDefaultData(): Promise<void> {
  if (!db) throw new Error("Database not initialized");

  console.log("📊 Inserting default data...");

  // Check if data already exists
  const categoryCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories"
  );

  if (categoryCount && categoryCount.count === 0) {
    console.log("📁 Inserting default categories...");

    // Insert data in a transaction
    await db.execAsync(`
      BEGIN TRANSACTION;
      
      INSERT INTO categories (name, percentage, balance) VALUES 
        ('Sedekah', 10, 0),
        ('Uang tak terduga', 15, 0),
        ('Uang belanja', 40, 0),
        ('Tabungan', 15, 0),
        ('Operasional', 10, 0),
        ('Maintenance', 10, 0);
      
      INSERT INTO expense_types (name, color) VALUES 
        ('Makanan & Minuman', '#FF6B6B'),
        ('Transportasi', '#4ECDC4'),
        ('Belanja', '#45B7D1'),
        ('Hiburan', '#96CEB4'),
        ('Kesehatan', '#FFEAA7'),
        ('Pendidikan', '#DDA0DD'),
        ('Tagihan', '#FFB347'),
        ('Lainnya', '#C0C0C0');
      
      COMMIT;
    `);

    console.log("✅ Default data inserted");
  }

  console.log("🏁 Default data insertion completed");
}

// Queued database operations class
class DatabaseOperations {
  // === CATEGORIES METHODS ===
  static async getAllCategories(): Promise<Category[]> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      return await database.getAllAsync<Category>(
        "SELECT * FROM categories ORDER BY name"
      );
    });
  }

  static async addCategory(category: Omit<Category, "id">): Promise<number> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      const result = await database.runAsync(
        "INSERT INTO categories (name, percentage, balance) VALUES (?, ?, ?)",
        [category.name, category.percentage, category.balance]
      );
      return result.lastInsertRowId;
    });
  }

  static async updateCategory(
    id: number,
    category: Omit<Category, "id">
  ): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      await database.runAsync(
        "UPDATE categories SET name = ?, percentage = ?, balance = ? WHERE id = ?",
        [category.name, category.percentage, category.balance, id]
      );
    });
  }

  static async deleteCategory(id: number): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Check if there are any transactions or loans referencing this category
      const transactionCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM transactions WHERE category_id = ?",
        [id]
      );

      const loanCount = await database.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM loans WHERE category_id = ?",
        [id]
      );

      if (transactionCount && transactionCount.count > 0) {
        throw new Error(
          `Cannot delete category: ${transactionCount.count} transaction(s) are using this category. Please delete or reassign transactions first.`
        );
      }

      if (loanCount && loanCount.count > 0) {
        throw new Error(
          `Cannot delete category: ${loanCount.count} loan(s) are using this category. Please delete or reassign loans first.`
        );
      }

      await database.runAsync("DELETE FROM categories WHERE id = ?", [id]);
    });
  }

  static async forcedeleteCategory(id: number): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Delete in transaction to ensure consistency
      await database.execAsync(`
        BEGIN TRANSACTION;
        DELETE FROM transactions WHERE category_id = ${id};
        DELETE FROM loans WHERE category_id = ${id};
        DELETE FROM categories WHERE id = ${id};
        COMMIT;
      `);
    });
  }

  // === TRANSACTIONS METHODS ===
  static async getAllTransactions(
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      return await database.getAllAsync<Transaction>(
        "SELECT * FROM transactions ORDER BY date DESC, id DESC LIMIT ? OFFSET ?",
        [limit, offset]
      );
    });
  }

  static async addTransaction(
    transaction: Omit<Transaction, "id">
  ): Promise<number> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Begin transaction to ensure data consistency
      await database.execAsync("BEGIN TRANSACTION");

      try {
        // Insert the transaction
        const result = await database.runAsync(
          "INSERT INTO transactions (type, amount, category_id, expense_type_id, note, date) VALUES (?, ?, ?, ?, ?, ?)",
          [
            transaction.type,
            transaction.amount,
            transaction.category_id,
            transaction.expense_type_id ?? null,
            transaction.note,
            transaction.date,
          ]
        );

        // Update category balance based on transaction type
        if (transaction.type === "income") {
          // Add to category balance for income
          await database.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        } else if (transaction.type === "expense") {
          // Subtract from category balance for expense
          await database.runAsync(
            "UPDATE categories SET balance = balance - ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        }

        await database.execAsync("COMMIT");
        return result.lastInsertRowId;
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    });
  }

  static async addMultipleTransactions(
    transactions: Array<Omit<Transaction, "id">>
  ): Promise<number[]> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Begin transaction untuk consistency dan performance
      await database.execAsync("BEGIN TRANSACTION");

      try {
        const insertedIds: number[] = [];

        // Process all transactions in a single database transaction
        for (const transaction of transactions) {
          // Insert the transaction
          const result = await database.runAsync(
            "INSERT INTO transactions (type, amount, category_id, expense_type_id, note, date) VALUES (?, ?, ?, ?, ?, ?)",
            [
              transaction.type,
              transaction.amount,
              transaction.category_id,
              transaction.expense_type_id ?? null,
              transaction.note,
              transaction.date,
            ]
          );

          insertedIds.push(result.lastInsertRowId);

          // Update category balance based on transaction type
          if (transaction.type === "income") {
            await database.runAsync(
              "UPDATE categories SET balance = balance + ? WHERE id = ?",
              [transaction.amount, transaction.category_id]
            );
          } else if (transaction.type === "expense") {
            await database.runAsync(
              "UPDATE categories SET balance = balance - ? WHERE id = ?",
              [transaction.amount, transaction.category_id]
            );
          }
        }

        await database.execAsync("COMMIT");
        console.log(`✅ Added ${transactions.length} transactions in batch`);
        return insertedIds;
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    });
  }

  static async updateTransaction(
    id: number,
    transaction: Omit<Transaction, "id">
  ): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Begin transaction to ensure data consistency
      await database.execAsync("BEGIN TRANSACTION");

      try {
        // Get old transaction data to reverse the balance changes
        const oldTransaction = await database.getFirstAsync<Transaction>(
          "SELECT * FROM transactions WHERE id = ?",
          [id]
        );

        if (!oldTransaction) {
          throw new Error("Transaction not found");
        }

        // Reverse old transaction's effect on category balance
        if (oldTransaction.type === "income") {
          await database.runAsync(
            "UPDATE categories SET balance = balance - ? WHERE id = ?",
            [oldTransaction.amount, oldTransaction.category_id]
          );
        } else if (oldTransaction.type === "expense") {
          await database.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [oldTransaction.amount, oldTransaction.category_id]
          );
        }

        // Update the transaction
        await database.runAsync(
          "UPDATE transactions SET type = ?, amount = ?, category_id = ?, expense_type_id = ?, note = ?, date = ? WHERE id = ?",
          [
            transaction.type,
            transaction.amount,
            transaction.category_id,
            transaction.expense_type_id ?? null,
            transaction.note,
            transaction.date,
            id,
          ]
        );

        // Apply new transaction's effect on category balance
        if (transaction.type === "income") {
          await database.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        } else if (transaction.type === "expense") {
          await database.runAsync(
            "UPDATE categories SET balance = balance - ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        }

        await database.execAsync("COMMIT");
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    });
  }

  static async deleteTransaction(id: number): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Begin transaction to ensure data consistency
      await database.execAsync("BEGIN TRANSACTION");

      try {
        // Get transaction data to reverse the balance changes
        const transaction = await database.getFirstAsync<Transaction>(
          "SELECT * FROM transactions WHERE id = ?",
          [id]
        );

        if (!transaction) {
          throw new Error("Transaction not found");
        }

        // Reverse transaction's effect on category balance
        if (transaction.type === "income") {
          await database.runAsync(
            "UPDATE categories SET balance = balance - ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        } else if (transaction.type === "expense") {
          await database.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [transaction.amount, transaction.category_id]
          );
        }

        // Delete the transaction
        await database.runAsync("DELETE FROM transactions WHERE id = ?", [id]);

        await database.execAsync("COMMIT");
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    });
  }

  // === EXPENSE TYPES METHODS ===
  static async getAllExpenseTypes(): Promise<ExpenseType[]> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      return await database.getAllAsync<ExpenseType>(
        "SELECT * FROM expense_types ORDER BY name ASC"
      );
    });
  }

  static async addExpenseType(
    expenseType: Omit<ExpenseType, "id">
  ): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      await database.runAsync(
        "INSERT INTO expense_types (name, color) VALUES (?, ?)",
        [expenseType.name, expenseType.color ?? "#6200EE"]
      );
    });
  }

  static async updateExpenseType(
    id: number,
    expenseType: Omit<ExpenseType, "id">
  ): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      await database.runAsync(
        "UPDATE expense_types SET name = ?, color = ? WHERE id = ?",
        [expenseType.name, expenseType.color ?? "#6200EE", id]
      );
    });
  }

  static async deleteExpenseType(id: number): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      await database.runAsync("DELETE FROM expense_types WHERE id = ?", [id]);
    });
  }

  // === LOANS METHODS ===
  static async getAllLoans(): Promise<Loan[]> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      return await database.getAllAsync<Loan>(
        "SELECT * FROM loans ORDER BY date DESC"
      );
    });
  }

  static async addLoan(loan: Omit<Loan, "id">): Promise<number> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Begin transaction untuk consistency
      await database.execAsync("BEGIN TRANSACTION");

      try {
        // Insert loan
        const result = await database.runAsync(
          "INSERT INTO loans (name, amount, category_id, status, date) VALUES (?, ?, ?, ?, ?)",
          [loan.name, loan.amount, loan.category_id, loan.status, loan.date]
        );

        // Update category balance - kurangi saldo karena uang dipinjamkan
        await database.runAsync(
          "UPDATE categories SET balance = balance - ? WHERE id = ?",
          [loan.amount, loan.category_id]
        );

        await database.execAsync("COMMIT");
        console.log(
          `💰 Loan created: -${loan.amount} from category ${loan.category_id}`
        );
        return result.lastInsertRowId;
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    });
  }

  static async updateLoan(id: number, loan: Omit<Loan, "id">): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Begin transaction untuk consistency
      await database.execAsync("BEGIN TRANSACTION");

      try {
        // Get old loan data to calculate balance changes
        const oldLoan = await database.getFirstAsync<Loan>(
          "SELECT * FROM loans WHERE id = ?",
          [id]
        );

        if (!oldLoan) {
          throw new Error("Loan not found");
        }

        // Update loan
        await database.runAsync(
          "UPDATE loans SET name = ?, amount = ?, category_id = ?, status = ?, date = ? WHERE id = ?",
          [loan.name, loan.amount, loan.category_id, loan.status, loan.date, id]
        );

        // Handle balance changes based on status changes
        if (oldLoan.status !== loan.status) {
          if (loan.status === "paid") {
            if (oldLoan.status === "unpaid") {
              // Loan fully paid from unpaid - return full amount to category
              await database.runAsync(
                "UPDATE categories SET balance = balance + ? WHERE id = ?",
                [loan.amount, loan.category_id]
              );
              console.log(
                `💰 Loan fully paid: +${loan.amount} to category ${loan.category_id}`
              );
            } else if (oldLoan.status === "half") {
              // Remaining half payment
              const halfAmount = loan.amount / 2;
              await database.runAsync(
                "UPDATE categories SET balance = balance + ? WHERE id = ?",
                [halfAmount, loan.category_id]
              );
              console.log(
                `💰 Loan remaining paid: +${halfAmount} to category ${loan.category_id}`
              );
            }
          } else if (loan.status === "half" && oldLoan.status === "unpaid") {
            // Partial payment - return half amount to category
            const halfAmount = loan.amount / 2;
            await database.runAsync(
              "UPDATE categories SET balance = balance + ? WHERE id = ?",
              [halfAmount, loan.category_id]
            );
            console.log(
              `💰 Loan half paid: +${halfAmount} to category ${loan.category_id}`
            );
          }
        }

        await database.execAsync("COMMIT");
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    });
  }

  static async deleteLoan(id: number): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      // Begin transaction untuk consistency
      await database.execAsync("BEGIN TRANSACTION");

      try {
        // Get loan data to reverse balance changes
        const loan = await database.getFirstAsync<Loan>(
          "SELECT * FROM loans WHERE id = ?",
          [id]
        );

        if (!loan) {
          throw new Error("Loan not found");
        }

        // Reverse loan effect on category balance based on status
        if (loan.status === "unpaid") {
          // Loan was never paid, return full amount to category
          await database.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [loan.amount, loan.category_id]
          );
          console.log(
            `💰 Unpaid loan deleted: +${loan.amount} returned to category ${loan.category_id}`
          );
        } else if (loan.status === "half") {
          // Half was paid, return remaining half to category
          const halfAmount = loan.amount / 2;
          await database.runAsync(
            "UPDATE categories SET balance = balance + ? WHERE id = ?",
            [halfAmount, loan.category_id]
          );
          console.log(
            `💰 Half-paid loan deleted: +${halfAmount} returned to category ${loan.category_id}`
          );
        }
        // If status is "paid", no balance adjustment needed

        // Delete the loan
        await database.runAsync("DELETE FROM loans WHERE id = ?", [id]);

        await database.execAsync("COMMIT");
      } catch (error) {
        await database.execAsync("ROLLBACK");
        throw error;
      }
    });
  }

  // === STATS METHODS ===
  static async getMonthlyStats(): Promise<MonthlyStats[]> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      return await database.getAllAsync<MonthlyStats>(`
        SELECT 
          strftime('%Y-%m', date) as month,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM transactions 
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC
      `);
    });
  }

  static async getExpenseStatsByType(): Promise<ExpenseStats[]> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();
      return await database.getAllAsync<ExpenseStats>(`
        SELECT 
          et.id as expense_type_id,
          et.name as expense_type_name,
          et.color,
          COALESCE(SUM(t.amount), 0) as total_amount
        FROM expense_types et
        LEFT JOIN transactions t ON et.id = t.expense_type_id AND t.type = 'expense'
        GROUP BY et.id, et.name, et.color
        ORDER BY total_amount DESC
      `);
    });
  }

  // === UTILITY METHODS ===
  static async resetAllData(): Promise<void> {
    return dbQueue.add(async () => {
      const database = await ensureDatabase();

      console.log("🗑️ Starting database reset...");

      try {
        // Reset with proper foreign key handling
        await database.execAsync(`
          BEGIN TRANSACTION;
          
          -- Disable foreign key constraints temporarily
          PRAGMA foreign_keys = OFF;
          
          -- Delete all data
          DELETE FROM loan_payments;
          DELETE FROM transactions;
          DELETE FROM loans;
          DELETE FROM categories;
          DELETE FROM expense_types;
          
          -- Reset autoincrement counters
          DELETE FROM sqlite_sequence WHERE name IN ('categories', 'transactions', 'loans', 'expense_types', 'loan_payments');
          
          -- Re-enable foreign key constraints
          PRAGMA foreign_keys = ON;
          
          COMMIT;
        `);

        console.log("✅ All data deleted successfully");

        // Insert default data
        await insertDefaultData();

        console.log("🎉 Database reset completed successfully!");
      } catch (error) {
        console.error("❌ Error during database reset:", error);
        await database.execAsync("ROLLBACK;");
        throw error;
      }
    });
  }

  static async initialize(): Promise<void> {
    await ensureDatabase();
  }

  static async closeDatabase(): Promise<void> {
    return dbQueue.add(async () => {
      if (db) {
        await db.closeAsync();
        db = null;
        isInitialized = false;
        initializationPromise = null;
      }
    });
  }
}

export default DatabaseOperations;
