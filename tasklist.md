# ✅ **tasklist.md – PENGEMBANGAN APLIKASI PENCATAT KEUANGAN (REACT EXPO + SQLITE)**

## 🧭 Tujuan
Membangun aplikasi Android berbasis **React Native (Expo)** dan **SQLite offline** untuk mencatat keuangan pribadi secara **ringan**, **stabil**, dan **user friendly**.  
Tasklist ini berfungsi sebagai panduan langkah demi langkah agar setiap proses pengembangan teratur, bisa dicek, dan ditandai (✔️) jika sudah selesai.

---

## 🏗️ **FASE 1 – INISIALISASI PROYEK**
- [ ] Membuat project Expo baru: `npx create-expo-app catatan-keuangan`
- [ ] Menjalankan project pertama kali: `npx expo start`
- [ ] Install dependency utama:
  - [ ] `expo-sqlite`
  - [ ] `@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`
  - [ ] `react-native-chart-kit` atau `react-native-svg-charts`
  - [ ] `expo-splash-screen`
  - [ ] `@expo/vector-icons`
  - [ ] `react-native-paper` atau `native-base`
- [ ] Membuat struktur folder proyek:
  - [ ] Struktur folder:
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
- [ ] Menambahkan icon dan splash logo ke `/src/assets/`
- [ ] Membuat splash screen dasar dengan `expo-splash-screen`

---

## 🧱 **FASE 2 – KONFIGURASI DATABASE (SQLite)**
- [ ] Membuat file `/src/db/database.js`
- [ ] Menginisialisasi koneksi SQLite menggunakan `expo-sqlite`
- [ ] Membuat file `/src/db/migrations.sql` untuk skema awal database
- [ ] Menyiapkan tabel:
  - [ ] `categories (id, name, percentage, balance)`
  - [ ] `transactions (id, type, amount, category_id, note, date)`
  - [ ] `loans (id, name, amount, category_id, status, date)`
- [ ] Menambahkan indexing untuk performa:
  - [ ] `CREATE INDEX idx_category_id ON transactions(category_id)`
  - [ ] `CREATE INDEX idx_date ON transactions(date)`
- [ ] Memastikan database auto-create saat aplikasi pertama dijalankan

---

## 💰 **FASE 3 – FITUR KATEGORI**
- [ ] Membuat screen `/src/screens/CategoryScreen.js`
- [ ] Membuat component `/src/components/CategoryCard.js`
- [ ] Implementasi CRUD kategori:
  - [ ] Tambah kategori baru
  - [ ] Edit kategori (nama & persentase)
  - [ ] Hapus kategori
- [ ] Menambahkan kategori default:
  - [ ] Sedekah 10%
  - [ ] Uang tak terduga 15%
  - [ ] Uang belanja 40%
  - [ ] Tabungan 15%
  - [ ] Operasional 10%
  - [ ] Maintenance 10%
- [ ] Menyimpan kategori ke SQLite
- [ ] Validasi total persentase ≤ 100%

---

## 💸 **FASE 4 – FITUR TRANSAKSI**
- [ ] Membuat screen `/src/screens/AddTransactionScreen.js`
- [ ] Membuat component `/src/components/TransactionItem.js`
- [ ] Menambahkan fungsi:
  - [ ] Tambah pemasukan global (otomatis dibagi ke semua kategori)
  - [ ] Tambah pemasukan ke kategori tertentu
  - [ ] Tambah pengeluaran (pilih kategori sumber)
- [ ] Menyimpan transaksi ke SQLite (`type = income / expense`)
- [ ] Menggunakan `useFocusEffect()` untuk refresh data otomatis
- [ ] Menambahkan pagination atau lazy load (`LIMIT + OFFSET`)
- [ ] Menambahkan filter transaksi:
  - [ ] Bulan ini
  - [ ] Bulan lalu
  - [ ] Semua data
- [ ] Menambahkan pencarian transaksi berdasarkan kategori atau catatan

---

## 🤝 **FASE 5 – FITUR PINJAMAN**
- [ ] Membuat screen `/src/screens/LoanScreen.js`
- [ ] Membuat tabel `loans` di SQLite jika belum ada
- [ ] Menambahkan form tambah pinjaman:
  - [ ] Nama peminjam
  - [ ] Jumlah uang
  - [ ] Kategori sumber
  - [ ] Tanggal pinjam
- [ ] Menambahkan tombol aksi:
  - [ ] **Lunas:** mengembalikan saldo ke kategori sumber
  - [ ] **Bayar Setengah:** mengembalikan sebagian saldo ke kategori sumber
  - [ ] **Hapus:** menghapus data pinjaman
- [ ] Mengatur status pinjaman:
  - [ ] `unpaid`
  - [ ] `half`
  - [ ] `paid`
- [ ] Memastikan update kategori sinkron saat pinjaman berubah status

---

## 📊 **FASE 6 – DASHBOARD & STATISTIK**
- [ ] Membuat screen `/src/screens/HomeScreen.js`
- [ ] Membuat component `/src/components/ChartCard.js`
- [ ] Menampilkan:
  - [ ] Total pemasukan bulan ini
  - [ ] Total pengeluaran bulan ini
  - [ ] Grafik pemasukan vs pengeluaran (batang/l lingkaran)
- [ ] Menggunakan `react-native-chart-kit` untuk visualisasi
- [ ] Menambahkan filter waktu:
  - [ ] Bulan ini
  - [ ] Bulan lalu
  - [ ] Semua bulan
- [ ] Menambahkan tampilan proporsi kategori (persentase alokasi)

---

## 🧭 **FASE 7 – NAVIGASI & KONTEXT**
- [ ] Menambahkan navigasi utama dengan `@react-navigation/native`
- [ ] Menambahkan BottomTabNavigation atau DrawerNavigation
- [ ] Membuat context global `/src/context/AppContext.js`
- [ ] Mengelola state:
  - [ ] Data kategori
  - [ ] Data transaksi
  - [ ] Data pinjaman
- [ ] Menggunakan Context Provider di `App.js`

---

## 🎨 **FASE 8 – UI & UX FINAL**
- [ ] Desain menggunakan warna lembut (biru muda, hijau lembut, pastel)
- [ ] Semua tombol memiliki ikon + label
- [ ] Menambahkan loading indicator saat proses data
- [ ] Menambahkan animasi ringan (fade-in, press effect)
- [ ] Responsif di berbagai ukuran layar Android
- [ ] Menggunakan komponen dari `react-native-paper` / `native-base`

---

## 🚀 **FASE 9 – SPLASH SCREEN & OPTIMASI**
- [ ] Membuat splash screen menggunakan `expo-splash-screen`
- [ ] Menampilkan logo “💸 CatatKu” selama 2–3 detik
- [ ] Transisi halus ke HomeScreen
- [ ] Optimasi performa:
  - [ ] Gunakan `async/await` di semua operasi database
  - [ ] Implementasi pagination di semua list
  - [ ] Indexing tabel SQLite
  - [ ] Hindari rendering berlebih
  - [ ] Pastikan semua async call ditangani dengan try/catch

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
