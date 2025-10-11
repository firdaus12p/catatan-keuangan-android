# 🧩 **prompt.md – PENGEMBANGAN APLIKASI PENCATAT KEUANGAN (REACT EXPO + SQLITE)**

## 🎯 Tujuan Proyek
Membangun aplikasi Android berbasis **React Native (Expo)** yang digunakan untuk **mencatat keuangan pribadi**, lengkap dengan **pembagian otomatis kategori, diagram analisis pemasukan/pengeluaran, dan pencatatan pinjaman teman.**  
Aplikasi ini **offline**, menggunakan **SQLite** sebagai basis data lokal, dan **harus ringan, cepat, serta user friendly.**

---

## ⚙️ Teknologi & Stack
| Komponen | Teknologi |
|-----------|------------|
| Framework | **React Native (Expo)** |
| Database Lokal | **SQLite (expo-sqlite / react-native-sqlite-storage)** |
| State Management | React Hooks / Context API |
| Chart | react-native-chart-kit atau react-native-svg-charts |
| Navigasi | @react-navigation/native |
| UI Library | NativeBase / React Native Paper / Custom Tailwind-like styling |
| Loading Screen | expo-splash-screen |
| Icon | @expo/vector-icons |
| Performance | Async/Await + Pagination + Index di SQLite |

---

## 🧱 Struktur Fitur Utama

### 1. Dashboard Utama
- Menampilkan ringkasan total:
  - Total pemasukan bulan ini
  - Total pengeluaran bulan ini
  - Grafik (diagram batang / lingkaran) perbandingan pemasukan & pengeluaran
- Filter data:
  - Bulan ini, bulan lalu, semua bulan
- Tombol navigasi cepat ke halaman:
  - Tambah Pemasukan
  - Tambah Pengeluaran
  - Kategori
  - Pinjaman

---

### 2. Manajemen Kategori
Fungsi:
- Tambah, edit, dan hapus kategori
- Setiap kategori memiliki:
  - id
  - nama
  - persentase (misal 10%, 40%, dst)
  - saldo (jumlah uang dalam kategori)
- Contoh kategori default:
  - Sedekah 10%
  - Uang tak terduga 15%
  - Uang belanja 40%
  - Tabungan 15%
  - Operasional 10%
  - Maintenance 10%
  
Logika:
- Saat user menambahkan pemasukan global (misal Rp 1.500.000), sistem otomatis membagi ke semua kategori berdasarkan persentase.
- Jika user menambahkan pemasukan khusus kategori, uang hanya masuk ke kategori tersebut.
- Semua kategori bisa diubah atau dihapus.

---

### 3. Transaksi (Pemasukan & Pengeluaran)
Fitur:
- Tambah pemasukan/pengeluaran
- Pilih kategori sumber/tujuan
- Input manual jumlah uang & deskripsi
- Gunakan tanggal otomatis (new Date)
- Transaksi tersimpan di SQLite

Fitur tambahan:
- Pagination / Lazy Load agar tidak lag saat scroll
- Indexing SQLite di kolom tanggal & kategori
- Filter transaksi berdasarkan:
  - Bulan ini
  - Bulan lalu
  - Semua

---

### 4. Fitur Pinjaman
Tujuan: mencatat siapa yang meminjam uang dan dari kategori mana uangnya diambil.

Fitur utama:
- Tambah data pinjaman:
  - Nama orang
  - Jumlah uang
  - Kategori sumber
  - Tanggal pinjam
- Tombol aksi:
  - Lunas → uang dikembalikan ke kategori asal.
  - Bayar Setengah → mengembalikan sebagian uang (misal 50%).
  - Hapus → menghapus data pinjaman dari database.

---

### 5. Statistik & Analisis
Fitur visualisasi:
- Diagram pemasukan/pengeluaran per kategori
- Diagram proporsi kategori (persentase alokasi)
- Dapat difilter berdasarkan bulan
- Menggunakan komponen chart responsif dari react-native-chart-kit

---

### 6. UI & UX Requirements
- UI harus user friendly, responsive, dan mudah dipahami.
- Gunakan warna lembut (pastel / biru muda / hijau lembut).
- Semua tombol memiliki icon + label teks.
- Gunakan sistem navigasi bottom tab atau drawer navigation.
- Tampilkan loading state saat memproses data besar.
- Gunakan splash screen dengan logo aplikasi (misal: “CatatKu - Aplikasi Keuangan Pribadi”).

---

### 7. Database Design (SQLite Schema)
Gunakan tabel-tabel berikut:

Tabel categories:
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT
- percentage: REAL
- balance: REAL

Tabel transactions:
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- type: TEXT ("income" atau "expense")
- amount: REAL
- category_id: INTEGER
- note: TEXT
- date: TEXT

Tabel loans:
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT
- amount: REAL
- category_id: INTEGER
- status: TEXT ("unpaid" / "half" / "paid")
- date: TEXT

Tambahkan index untuk performa:
- CREATE INDEX idx_category_id ON transactions(category_id);
- CREATE INDEX idx_date ON transactions(date);

---

### 8. Performance & Optimasi
- Gunakan async/await untuk semua operasi SQLite.
- Jangan load seluruh tabel langsung, gunakan LIMIT + OFFSET.
- Implementasikan lazy loading / infinite scroll untuk daftar transaksi.
- Gunakan useFocusEffect() untuk refresh data saat screen aktif.
- Gunakan expo-sqlite versi terbaru (async).

---

### 9. Splash Screen
- Gunakan expo-splash-screen.
- Logo “💸 CatatKu” muncul saat pertama kali aplikasi dijalankan.
- Transisi smooth ke halaman Home setelah 2–3 detik.

---

### 10. Struktur Folder
/App.js  
/src/  
 ├─ screens/  
 │   ├─ HomeScreen.js  
 │   ├─ CategoryScreen.js  
 │   ├─ AddTransactionScreen.js  
 │   ├─ LoanScreen.js  
 │   ├─ StatisticScreen.js  
 ├─ components/  
 │   ├─ CategoryCard.js  
 │   ├─ TransactionItem.js  
 │   ├─ ChartCard.js  
 ├─ db/  
 │   ├─ database.js  
 │   └─ migrations.sql  
 ├─ context/  
 │   └─ AppContext.js  
 ├─ utils/  
 │   ├─ formatCurrency.js  
 │   └─ dateHelper.js  
 ├─ assets/  
 │   └─ splash.png  

---

### 11. Output yang Diharapkan
AI menghasilkan:
- Kode proyek React Expo yang lengkap dan bisa dijalankan (npx expo start).
- Desain UI rapi, responsif, dan ringan.
- Database SQLite dengan indexing & pagination.
- Fungsi-fungsi sesuai kebutuhan:
  - Pembagian otomatis kategori
  - Transaksi pemasukan & pengeluaran
  - Manajemen pinjaman
  - Grafik analisis
  - Splash screen

---

### 12. Target Akhir
Aplikasi berjalan offline, stabil, dan cepat, dengan tampilan profesional dan fitur lengkap untuk kebutuhan pencatatan keuangan pribadi harian.

---

Kalimat penutup untuk AI:
Buat seluruh struktur proyek dan implementasinya secara modular, bersih, dan mengikuti praktik terbaik React Native + SQLite. Pastikan semua fitur berjalan tanpa crash, tampilan indah, dan performa ringan di perangkat Android kelas menengah.
