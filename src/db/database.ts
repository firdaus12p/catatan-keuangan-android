import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { SQLiteDatabase, openDatabaseAsync, type SQLiteBindValue } from "expo-sqlite";

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo asset pipeline membutuhkan require statis
const migrationsAsset = require("./migrations.sql") as number;

export interface CategoryRecord {
  id: number;
  name: string;
  percentage: number;
  balance: number;
}

export interface TransactionRecord {
  id: number;
  type: "income" | "expense";
  amount: number;
  categoryId: number;
  note: string;
  date: string;
  categoryName: string;
}

export interface LoanRecord {
  id: number;
  name: string;
  amount: number;
  categoryId: number;
  status: "unpaid" | "half" | "paid";
  date: string;
  categoryName: string;
}

export interface TransactionQueryOptions {
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
  type?: "income" | "expense";
  categoryId?: number;
}

export interface TransactionSummary {
  income: number;
  expense: number;
}

export interface CategoryAggregate {
  categoryId: number;
  categoryName: string;
  percentage: number;
  balance: number;
  income: number;
  expense: number;
}

const DEFAULT_CATEGORIES: { name: string; percentage: number }[] = [
  { name: "Sedekah", percentage: 10 },
  { name: "Uang tak terduga", percentage: 15 },
  { name: "Uang belanja", percentage: 40 },
  { name: "Tabungan", percentage: 15 },
  { name: "Operasional", percentage: 10 },
  { name: "Maintenance", percentage: 10 },
];

let databaseInstance: SQLiteDatabase | null = null;

async function loadMigrations(): Promise<string> {
  const asset = Asset.fromModule(migrationsAsset);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    throw new Error("Migrations SQL tidak ditemukan.");
  }

  return FileSystem.readAsStringAsync(uri);
}

async function runMigrations(db: SQLiteDatabase) {
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const sql = await loadMigrations();
  const statements = sql
    .split(/;\s*[\r\n]+/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.execAsync(statement);
  }

  await ensureDefaultCategories(db);
}

async function ensureDefaultCategories(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories",
  );
  if (result?.count && result.count > 0) {
    return;
  }

  for (const category of DEFAULT_CATEGORIES) {
    await db.runAsync(
      "INSERT OR IGNORE INTO categories (name, percentage, balance) VALUES (?, ?, ?)",
      [category.name, category.percentage, 0],
    );
  }
}

async function getDatabase(): Promise<SQLiteDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  const db = await openDatabaseAsync("catatku.db");
  await runMigrations(db);
  databaseInstance = db;
  return db;
}

export async function withTransaction<T>(
  callback: (tx: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const db = await getDatabase();
  let result: T | undefined;
  await db.withTransactionAsync(async () => {
    result = await callback(db);
  });
  return result as T;
}

export async function getAllCategories(): Promise<CategoryRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRecord>(
    "SELECT id, name, percentage, balance FROM categories ORDER BY id ASC",
  );
  return rows.map((row) => ({
    ...row,
    percentage: Number(row.percentage),
    balance: Number(row.balance),
  }));
}

export async function createCategory(payload: {
  name: string;
  percentage: number;
  balance?: number;
}): Promise<CategoryRecord> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO categories (name, percentage, balance) VALUES (?, ?, ?)",
    [payload.name, payload.percentage, payload.balance ?? 0],
  );
  return {
    id: Number(result.lastInsertRowId),
    name: payload.name,
    percentage: payload.percentage,
    balance: payload.balance ?? 0,
  };
}

export async function updateCategory(
  id: number,
  payload: { name: string; percentage: number },
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE categories SET name = ?, percentage = ? WHERE id = ?",
    [payload.name, payload.percentage, id],
  );
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM categories WHERE id = ?", [id]);
}

async function adjustCategoryBalanceInternal(
  db: SQLiteDatabase,
  id: number,
  delta: number,
) {
  await db.runAsync(
    "UPDATE categories SET balance = balance + ? WHERE id = ?",
    [delta, id],
  );
}

export async function adjustCategoryBalance(
  id: number,
  delta: number,
  dbOverride?: SQLiteDatabase,
): Promise<void> {
  if (dbOverride) {
    await adjustCategoryBalanceInternal(dbOverride, id, delta);
    return;
  }
  const db = await getDatabase();
  await adjustCategoryBalanceInternal(db, id, delta);
}

export async function insertTransaction(
  payload: Omit<TransactionRecord, "id" | "categoryName">,
  dbOverride?: SQLiteDatabase,
): Promise<number> {
  const db = dbOverride ?? (await getDatabase());
  const result = await db.runAsync(
    "INSERT INTO transactions (type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?)",
    [payload.type, payload.amount, payload.categoryId, payload.note, payload.date],
  );
  return Number(result.lastInsertRowId);
}

function buildTransactionQuery(
  options: TransactionQueryOptions,
): { sql: string; params: SQLiteBindValue[] } {
  const conditions: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (options.startDate) {
    conditions.push("t.date >= ?");
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push("t.date <= ?");
    params.push(options.endDate);
  }
  if (options.type) {
    conditions.push("t.type = ?");
    params.push(options.type);
  }
  if (options.categoryId) {
    conditions.push("t.category_id = ?");
    params.push(options.categoryId);
  }
  if (options.search && options.search.length > 0) {
    conditions.push("(t.note LIKE ? OR c.name LIKE ?)");
    const keyword = `%${options.search}%`;
    params.push(keyword, keyword);
  }

  let sql = `
    SELECT t.id,
           t.type,
           t.amount,
           t.category_id as categoryId,
           t.note,
           t.date,
           c.name as categoryName
    FROM transactions t
    INNER JOIN categories c ON c.id = t.category_id
  `;

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += " ORDER BY t.date DESC, t.id DESC";

  if (typeof options.limit === "number") {
    sql += " LIMIT ?";
    params.push(options.limit);
  }
  if (typeof options.offset === "number") {
    sql += " OFFSET ?";
    params.push(options.offset);
  }

  return { sql, params };
}

export async function getTransactions(
  options: TransactionQueryOptions,
): Promise<TransactionRecord[]> {
  const db = await getDatabase();
  const { sql, params } = buildTransactionQuery(options);
  const rows = await db.getAllAsync<TransactionRecord>(sql, params);
  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export async function getTransactionsCount(
  options: TransactionQueryOptions,
): Promise<number> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (options.startDate) {
    conditions.push("date >= ?");
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push("date <= ?");
    params.push(options.endDate);
  }
  if (options.type) {
    conditions.push("type = ?");
    params.push(options.type);
  }
  if (options.categoryId) {
    conditions.push("category_id = ?");
    params.push(options.categoryId);
  }
  if (options.search && options.search.length > 0) {
    const keyword = `%${options.search}%`;
    conditions.push("(note LIKE ? OR category_id IN (SELECT id FROM categories WHERE name LIKE ?))");
    params.push(keyword, keyword);
  }

  let sql = "SELECT COUNT(*) as total FROM transactions";
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  const row = await db.getFirstAsync<{ total: number }>(sql, params);
  return Number(row?.total ?? 0);
}

export async function getTransactionSummary(
  options: TransactionQueryOptions,
): Promise<TransactionSummary> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (options.startDate) {
    conditions.push("date >= ?");
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push("date <= ?");
    params.push(options.endDate);
  }
  if (options.search && options.search.length > 0) {
    const keyword = `%${options.search}%`;
    conditions.push("(note LIKE ? OR category_id IN (SELECT id FROM categories WHERE name LIKE ?))");
    params.push(keyword, keyword);
  }
  if (options.categoryId) {
    conditions.push("category_id = ?");
    params.push(options.categoryId);
  }

  let sql = `
    SELECT
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
  `;

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  const row = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    sql,
    params,
  );

  return {
    income: Number(row?.income ?? 0),
    expense: Number(row?.expense ?? 0),
  };
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

export async function getLoans(): Promise<LoanRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LoanRecord>(
    `
      SELECT l.id,
             l.name,
             l.amount,
             l.category_id as categoryId,
             l.status,
             l.date,
             c.name as categoryName
      FROM loans l
      INNER JOIN categories c ON c.id = l.category_id
      ORDER BY l.date DESC, l.id DESC
    `,
  );
  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export async function insertLoan(
  payload: Omit<LoanRecord, "id" | "categoryName">,
  dbOverride?: SQLiteDatabase,
): Promise<number> {
  const db = dbOverride ?? (await getDatabase());
  const result = await db.runAsync(
    "INSERT INTO loans (name, amount, category_id, status, date) VALUES (?, ?, ?, ?, ?)",
    [payload.name, payload.amount, payload.categoryId, payload.status, payload.date],
  );
  return Number(result.lastInsertRowId);
}

export async function updateLoanStatus(
  id: number,
  status: "unpaid" | "half" | "paid",
  dbOverride?: SQLiteDatabase,
): Promise<void> {
  const db = dbOverride ?? (await getDatabase());
  await db.runAsync("UPDATE loans SET status = ? WHERE id = ?", [status, id]);
}

export async function deleteLoan(id: number, dbOverride?: SQLiteDatabase): Promise<void> {
  const db = dbOverride ?? (await getDatabase());
  await db.runAsync("DELETE FROM loans WHERE id = ?", [id]);
}

export async function initializeDatabase(): Promise<void> {
  await getDatabase();
}

export function getDefaultCategories() {
  return DEFAULT_CATEGORIES.map((item) => ({ ...item }));
}

export async function getCategoryAggregates(options: {
  startDate?: string;
  endDate?: string;
} = {}): Promise<CategoryAggregate[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: SQLiteBindValue[] = [];

  if (options.startDate) {
    conditions.push("t.date >= ?");
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push("t.date <= ?");
    params.push(options.endDate);
  }

  let joinClause = "LEFT JOIN transactions t ON t.category_id = c.id";
  if (conditions.length > 0) {
    joinClause += ` AND ${conditions.join(" AND ")}`;
  }

  const sql = `
    SELECT
      c.id as categoryId,
      c.name as categoryName,
      c.percentage as percentage,
      c.balance as balance,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expense
    FROM categories c
    ${joinClause}
    GROUP BY c.id, c.name, c.percentage, c.balance
    ORDER BY c.id
  `;

  const rows = await db.getAllAsync<CategoryAggregate>(sql, params);
  return rows.map((row) => ({
    ...row,
    percentage: Number(row.percentage),
    balance: Number(row.balance),
    income: Number(row.income),
    expense: Number(row.expense),
  }));
}
