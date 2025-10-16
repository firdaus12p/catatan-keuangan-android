# ⚙️ Instruksi GitHub Copilot untuk Kemenku (Aplikasi Keuangan Pribadi)

## 🧙️ Gambaran Proyek

**Kemenku** adalah aplikasi pencatat keuangan pribadi berprinsip offline-first yang dibangun dengan **React Native Expo** dan **SQLite**.
Fitur utama: distribusi pendapatan otomatis berbasis kategori, pencatatan pengeluaran, dan manajemen pinjaman.

## 🎗️ Arsitektur & Pola Kritis

### 🗂️ Struktur Berkas

```
app/                    # Routing berbasis file Expo Router v6 (setup minimal)
├── (tabs)/             # Layout navigasi tab
├── index.tsx           # Splash screen dengan delay 2 detik → /(tabs)/
src/                    # Kode utama aplikasi
├── screens/            # Komponen halaman (HomeScreen.tsx, dll.)
├── components/         # Komponen UI yang dapat digunakan kembali
├── db/database.ts      # Singleton SQLite dengan sistem migrasi
├── context/AppContext.tsx # Manajemen state global
├── styles/commonStyles.ts # Warna tema dan gaya bersama
└── utils/              # Fungsi pembantu (formatCurrency, dateHelper)
```

### 🧱 Desain Database (SQLite dengan expo-sqlite)

```sql
categories: id, name, percentage, balance
transactions: id, type(income/expense), amount, category_id, note, date
loans: id, name, amount, category_id, status(unpaid/half/paid), date
-- Indexed: category_id, date untuk performa
```

### 🧠 Pola Manajemen State

* **Global State**: `AppContext.tsx` dengan fungsi yang dioptimalkan `useCallback`
* **Akses Database**: Singleton langsung (`database.ts`)
* **Penyegaran Layar**: `useFocusEffect()` untuk memuat ulang data saat layar aktif
* **Status Loading**: Context menyediakan boolean loading untuk operasi async

## 💡 Logika Bisnis Inti

### 🎯 Sistem Kategori

* **Distribusi otomatis**: Pendapatan global dibagi ke kategori berdasarkan persentase (total harus ≤100%)
* **Pendapatan langsung**: Tambah pendapatan ke kategori spesifik tanpa memengaruhi yang lain
* **Pelacakan saldo**: Tiap kategori menjaga saldo berjalan yang diperbarui oleh transaksi

### 💸 Pemrosesan Transaksi

```typescript
// Pola: Selalu validasi saldo kategori sebelum pengeluaran
const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  if (transaction.type === "expense") {
    // Validasi saldo kategori mencukupi
  }
  await database.addTransaction(transaction);
  await loadCategories(); // Segarkan saldo
};
```

### 🤝 Manajemen Pinjaman

* **Alur uang**: Pembuatan pinjaman mengurangi saldo kategori → pembayaran mengembalikan saldo
* **Pelacakan status**: `unpaid` → `half` → `paid` dengan dukungan pembayaran sebagian

## ⚙️ Pola Pengembangan

### 🧙️ Standar Kode

* **TypeScript**: Strict mode aktif dengan interface yang tepat
* **Navigasi**: Routing berbasis file memakai Expo Router v6
* **Database**: Semua operasi gunakan `async/await` dengan try/catch, paginasi dengan LIMIT/OFFSET
* **Performa**: `useCallback` untuk fungsi context, `useMemo` untuk perhitungan berat

### 🎨 Konvensi UI/UX

* **Warna**: Gunakan objek `colors` dari `commonStyles.ts` (penamaan semantik: `colors.income`, `colors.expense`)
* **Ikon**: `@expo/vector-icons/MaterialIcons` dengan label teks
* **Komponen**: `react-native-paper` untuk Material Design yang konsisten
* **Grafik**: `react-native-chart-kit` untuk visualisasi data

### 🛠️ Alur Pengembangan

```bash
npm install
npx expo start              # Server pengembangan
npx expo start --clear      # Bersihkan cache bila perlu
npm run reset-project       # Pindahkan app-example sebagai referensi, buat app/ kosong
```

## 🗄️ Operasi Database

### Pola Migrasi

```typescript
// database.ts inisialisasi dengan pembaruan skema otomatis
await this.db.execAsync(`CREATE TABLE IF NOT EXISTS...`);
await this.addColumnIfNotExists("table", "column", "TYPE");
```

### Pola Pemanggilan Data

```typescript
// Selalu gunakan useFocusEffect untuk penyegaran data saat layar aktif
useFocusEffect(
  React.useCallback(() => {
    loadCategories();
    loadTransactions();
  }, [])
);
```

## 🗁 Penamaan & Organisasi Berkas

* **Screens**: PascalCase → `CategoryScreen.tsx`
* **Components**: PascalCase → `CategoryCard.tsx`
* **Utils**: camelCase → `formatCurrency.ts`
* **Komentar**: Logika bisnis dalam Bahasa Indonesia, komentar teknis dalam Bahasa Inggris
* **Tanpa berkas sementara**: Hindari `test.js`, `debug.js`, `temp.js`

## 🥪 Pengujian & Validasi

* Uji semua operasi CRUD pada perangkat/emulator Android nyata
* Verifikasi validasi persentase kategori (total ≤100%)
* Uji paginasi dengan dataset besar
* Pastikan fungsi offline (tanpa dependensi API eksternal)
* Validasi desain responsif di berbagai ukuran layar Android

## 📘 Dependensi Utama

* Expo SDK ~54.0, React 19.1.0, TypeScript ~5.9.2
* expo-router ~6.0 (routing berbasis file)
* expo-sqlite (database lokal)
* react-native-paper (komponen Material Design)
* react-native-chart-kit (visualisasi data)

## 🚨 Hal Penting (Gotchas)

* Gunakan `useFocusEffect()` alih-alih `useEffect()` untuk pemuatan data layar
* Selalu bungkus fungsi context dengan `useCallback` untuk mencegah loop tak berujung
* Validasi saldo kategori sebelum mengizinkan pengeluaran
* Gunakan paginasi untuk daftar transaksi agar performa terjaga
* Aplikasi 100% offline — tanpa dependensi jaringan
