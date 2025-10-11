# ✅ **tasklist.md – PENGEMBANGAN APLIKASI PENCATAT KEUANGAN (REACT EXPO + SQLITE)**

## 🧭 Tujuan
Membangun aplikasi Android berbasis **React Native (Expo)** dan **SQLite offline** untuk mencatat keuangan pribadi secara **ringan**, **stabil**, dan **user friendly**.  
Tasklist ini berfungsi sebagai panduan langkah demi langkah agar setiap proses pengembangan teratur, bisa dicek, dan ditandai (✔️) jika sudah selesai.

---

## 🏗️ **FASE 1 – INISIALISASI PROYEK**
- [x] Membuat project Expo baru: `npx create-expo-app catatan-keuangan`
- [ ] Menjalankan project pertama kali: `npx expo start`
- [ ] Install dependency utama:
  - [x] `expo-sqlite`
  - [x] `@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`
  - [x] `react-native-chart-kit` atau `react-native-svg-charts`
  - [x] `expo-splash-screen`
  - [x] `@expo/vector-icons`
  - [x] `react-native-paper` atau `native-base`
- [x] Membuat struktur folder proyek:
  - [x] Struktur folder:
    ```
    /App.js
    /src/
     ├─ screens/
     ├─ components/
     ├─ db/
     ├─ context/
     ├─ utils/
     ├─ assets/
    ```
- [x] Menambahkan icon dan splash logo ke `/src/assets/`
- [x] Membuat splash screen dasar dengan `expo-splash-screen`

---

## 🧱 **FASE 2 – KONFIGURASI DATABASE (SQLite)**
- [x] Membuat file `/src/db/database.js`
- [x] Menginisialisasi koneksi SQLite menggunakan `expo-sqlite`
- [x] Membuat file `/src/db/migrations.sql` untuk skema awal database
- [x] Menyiapkan tabel:
  - [x] `categories (id, name, percentage, balance)`
  - [x] `transactions (id, type, amount, category_id, note, date)`
  - [x] `loans (id, name, amount, category_id, status, date)`
- [x] Menambahkan indexing untuk performa:
  - [x] `CREATE INDEX idx_category_id ON transactions(category_id)`
  - [x] `CREATE INDEX idx_date ON transactions(date)`
- [x] Memastikan database auto-create saat aplikasi pertama dijalankan

---

## 💰 **FASE 3 – FITUR KATEGORI**
- [x] Membuat screen `/src/screens/CategoryScreen.js`
- [x] Membuat component `/src/components/CategoryCard.js`
- [x] Implementasi CRUD kategori:
  - [x] Tambah kategori baru
  - [x] Edit kategori (nama & persentase)
  - [x] Hapus kategori
- [x] Menambahkan kategori default:
  - [x] Sedekah 10%
  - [x] Uang tak terduga 15%
  - [x] Uang belanja 40%
  - [x] Tabungan 15%
  - [x] Operasional 10%
  - [x] Maintenance 10%
- [x] Menyimpan kategori ke SQLite
- [x] Validasi total persentase <= 100%

---

## 💸 **FASE 4 – FITUR TRANSAKSI**
- [x] Membuat screen `/src/screens/AddTransactionScreen.js`
- [x] Membuat component `/src/components/TransactionItem.js`
- [x] Menambahkan fungsi:
  - [x] Tambah pemasukan global (otomatis dibagi ke semua kategori)
  - [x] Tambah pemasukan ke kategori tertentu
  - [x] Tambah pengeluaran (pilih kategori sumber)
- [x] Menyimpan transaksi ke SQLite (`type = income / expense`)
- [x] Menggunakan `useFocusEffect()` untuk refresh data otomatis
- [x] Menambahkan pagination atau lazy load (`LIMIT + OFFSET`)
- [x] Menambahkan filter transaksi:
  - [x] Bulan ini
  - [x] Bulan lalu
  - [x] Semua data
- [x] Menambahkan pencarian transaksi berdasarkan kategori atau catatan

---

## 🤝 **FASE 5 – FITUR PINJAMAN**
- [x] Membuat screen `/src/screens/LoanScreen.js`
- [x] Membuat tabel `loans` di SQLite jika belum ada
- [x] Menambahkan form tambah pinjaman:
  - [x] Nama peminjam
  - [x] Jumlah uang
  - [x] Kategori sumber
  - [x] Tanggal pinjam
- [x] Menambahkan tombol aksi:
  - [x] **Lunas:** mengembalikan saldo ke kategori sumber
  - [x] **Bayar Setengah:** mengembalikan sebagian saldo ke kategori sumber
  - [x] **Hapus:** menghapus data pinjaman
- [x] Mengatur status pinjaman:
  - [x] `unpaid`
  - [x] `half`
  - [x] `paid`
- [x] Memastikan update kategori sinkron saat pinjaman berubah status

---

## 📊 **FASE 6 – DASHBOARD & STATISTIK**
- [x] Membuat screen `/src/screens/HomeScreen.js`
- [x] Membuat component `/src/components/ChartCard.js`
- [x] Menampilkan:
  - [x] Total pemasukan bulan ini
  - [x] Total pengeluaran bulan ini
  - [x] Grafik pemasukan vs pengeluaran (batang/l lingkaran)
- [x] Menggunakan `react-native-chart-kit` untuk visualisasi
- [x] Menambahkan filter waktu:
  - [x] Bulan ini
  - [x] Bulan lalu
  - [x] Semua bulan
- [x] Menambahkan tampilan proporsi kategori (persentase alokasi)

---

## 🧭 **FASE 7 – NAVIGASI & KONTEXT**
- [x] Menambahkan navigasi utama dengan `@react-navigation/native`
- [x] Menambahkan BottomTabNavigation atau DrawerNavigation
- [x] Membuat context global `/src/context/AppContext.js`
- [x] Mengelola state:
  - [x] Data kategori
  - [x] Data transaksi
  - [x] Data pinjaman
- [x] Menggunakan Context Provider di `App.js`

---

## 🎨 **FASE 8 – UI & UX FINAL**
- [x] Desain menggunakan warna lembut (biru muda, hijau lembut, pastel)
- [x] Semua tombol memiliki ikon + label
- [x] Menambahkan loading indicator saat proses data
- [ ] Menambahkan animasi ringan (fade-in, press effect)
- [x] Responsif di berbagai ukuran layar Android
- [x] Menggunakan komponen dari `react-native-paper` / `native-base`

---

## 🚀 **FASE 9 – SPLASH SCREEN & OPTIMASI**
- [x] Membuat splash screen menggunakan `expo-splash-screen`
- [x] Menampilkan logo CatatKu selama 2-3 detik
- [x] Transisi halus ke HomeScreen
- [x] Optimasi performa:
  - [x] Gunakan `async/await` di semua operasi database
  - [x] Implementasi pagination di semua list
  - [x] Indexing tabel SQLite
  - [x] Hindari rendering berlebih
  - [x] Pastikan semua async call ditangani dengan try/catch

---

## 🧾 **FASE 10 – TESTING & DEPLOY**
- [ ] Uji setiap fitur (kategori, transaksi, pinjaman, statistik)
- [ ] Uji filter bulan & pagination
- [ ] Uji pembagian otomatis kategori
- [ ] Cek performa di perangkat Android kelas menengah
- [ ] Jalankan `npx expo start` dan pastikan tidak ada error
- [ ] Build APK untuk pengujian: `npx expo run:android`
- [ ] Pastikan aplikasi berjalan offline tanpa crash

---

## 🎯 **TARGET AKHIR**
- [ ] Aplikasi berjalan 100% offline
- [ ] Tampilan profesional dan ringan
- [ ] Database SQLite stabil dan cepat
- [ ] Semua fitur berjalan tanpa bug
- [ ] Siap di-deploy ke Google Play (opsional)

---

**Catatan:**
> Setiap kali satu bagian selesai, beri tanda ✔️ pada checklist di atas agar AI Agent dan developer tahu progres terakhir.
