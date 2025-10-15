-- CatatKu Database Schema
-- Aplikasi Pencatat Keuangan Pribadi
-- Created: October 2025

-- Tabel untuk menyimpan kategori uang
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  percentage REAL NOT NULL,
  balance REAL NOT NULL DEFAULT 0
);

-- Tabel untuk menyimpan transaksi (pemasukan dan pengeluaran)
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

-- Tabel untuk menyimpan jenis pengeluaran
CREATE TABLE IF NOT EXISTS expense_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

-- Tabel untuk menyimpan data pinjaman
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('unpaid', 'half', 'paid')),
  date TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Index untuk meningkatkan performa query
CREATE INDEX IF NOT EXISTS idx_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_type_id ON transactions(expense_type_id);
CREATE INDEX IF NOT EXISTS idx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_loan_status ON loans(status);

-- Data default kategori
INSERT OR IGNORE INTO categories (name, percentage, balance) VALUES
('Sedekah', 10, 0),
('Uang tak terduga', 15, 0),
('Uang belanja', 40, 0),
('Tabungan', 15, 0),
('Operasional', 10, 0),
('Maintenance', 10, 0);

-- Data default jenis pengeluaran
INSERT OR IGNORE INTO expense_types (name, created_at) VALUES
('Makanan', datetime('now')),
('Minuman', datetime('now')),
('Transportasi', datetime('now')),
('Belanja', datetime('now')),
('Hiburan', datetime('now'));