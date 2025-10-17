# 🧠 OPTIMISASI KINERJA DAN PENGIRIMAN DATA (KEMENKU APP – REACT NATIVE EXPO SQLITE)

## 🎯 Tujuan

Perbaiki masalah performa aplikasi **Kemenku** di mana:

* Tombol kadang tidak responsif saat ditekan (delay klik).
* Saat menekan tombol *Simpan* (pemasukan, pengeluaran, pinjaman dll.), aplikasi lambat merespons.
* Proses penyimpanan dan refresh data terasa berat dan membuat UI freeze sesaat.

## 🧩 Konteks Proyek

* Framework: **React Native (Expo) + SQLite (expo-sqlite)**
* Arsitektur: Offline-first, tanpa backend, semua data disimpan di lokal SQLite.
* Semua logika bisnis wajib berjalan tanpa internet.
* Gunakan prinsip performa tinggi dan optimasi UI agar app tidak nge-lag, tidak freeze, dan tetap ringan.
* Pastikan perubahan tidak melanggar struktur folder dan arsitektur yang sudah ada.

## ⚙️ Tugas AI

1. **Analisis seluruh codebase (global audit):**

   * Telusuri setiap pemanggilan fungsi penyimpanan (tombol simpan, tambah transaksi, tambah pinjaman, dll).
   * Identifikasi fungsi yang menyebabkan re-render berat, blocking UI thread, atau memuat data berlebihan.
   * Deteksi fungsi yang memanggil `loadAll...()` atau `SELECT * FROM ...` tanpa alasan efisien.

2. **Optimasi kinerja tombol dan event handler:**

   * Gunakan `useCallback` untuk fungsi event seperti `handleSave`, `handleAddTransaction`, dll.
   * Gunakan `InteractionManager.runAfterInteractions()` untuk menjalankan proses berat setelah animasi selesai.
   * Pastikan semua tombol merespons instan (UI segera update state loading).

3. **Optimasi proses penyimpanan data:**

   * Jalankan query database dalam `db.transactionAsync()` untuk mempercepat commit.
   * Kirim atau ubah hanya data yang benar-benar perlu:

     * Jika hanya satu transaksi ditambahkan → jangan re-fetch semua kategori & transaksi.
     * Jika saldo kategori berubah → update langsung di context tanpa query ulang seluruh tabel.
   * Hindari `await` bertingkat di dalam event tombol (gabungkan dalam satu async/await tunggal).

4. **Perbaiki perilaku loading:**

   * Jangan gunakan setTimeout untuk simulasi delay; gantikan dengan async state nyata.
   * Gunakan lazy loading (misal, muat transaksi hanya saat tab aktif menggunakan `useFocusEffect`).

5. **Minimalkan re-render komponen:**

   * Gunakan `React.memo` pada komponen seperti `TransactionList`, `CategoryCard`, dan `LoanItem`.
   * Gunakan `useMemo` untuk data turunan seperti total saldo, total pengeluaran, dan total pinjaman.
   * Pisahkan context berat menjadi beberapa context kecil agar perubahan state tidak memicu render seluruh app.

6. **Optimasi database dan query:**

   * Tambahkan indeks untuk kolom `category_id` dan `date` bila belum ada, ingat bila belum ada, tapi jika sudah ada jangan ditambahkan ulang.
   * Gunakan prepared statements untuk query yang sering dipanggil dengan parameter dinamis.
   * Pastikan semua query memiliki LIMIT/OFFSET untuk paginasi.
   * Pastikan migrasi schema sinkron dengan struktur data terkini (misal kolom baru seperti `color` sudah ada).

7. **Uji performa dan validasi hasil:**

   * Jalankan profiling dengan `npx expo start --no-dev --minify` untuk memastikan UI tetap lancar.
   * Pastikan semua fungsi database hanya memproses data yang dibutuhkan.

## ✅ Output yang Diharapkan

Setelah prompt ini dijalankan oleh **Claude Sonnet 4 Copilot Mode Agent**:

* Semua tombol memiliki respon instan.
* Operasi penyimpanan data (tambah/edit/hapus transaksi, pinjaman, kategori) berjalan cepat tanpa freeze.
* Tidak ada query berlebihan (tidak mengambil semua tabel jika tidak perlu).
* UI tetap halus, dengan loading state yang informatif.
* App tetap sepenuhnya offline-first dan sesuai dengan panduan di `copilot-instructions-kemenku.md`.

> 🧩 Catatan: Jangan ubah arsitektur utama aplikasi atau struktur folder. Fokuskan perbaikan pada performa, efisiensi render, dan optimalisasi query database.
