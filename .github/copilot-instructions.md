# ⚙️ Instruksi GitHub Copilot untuk Proyek CatatKu (Aplikasi Catatan Keuangan)

## 🧩 Gambaran Umum Proyek

Aplikasi pencatat keuangan pribadi berbahasa Indonesia yang dibuat menggunakan **React Native Expo** dan **SQLite**.  
Nama aplikasi: **CatatKu**.  
Aplikasi ini memiliki arsitektur **offline-first** dengan fitur:
- Pembagian otomatis berdasarkan kategori.
- Pencatatan pemasukan dan pengeluaran.
- Manajemen pinjaman (utang/piutang).

---

## 🏗️ Arsitektur & Pola Utama

### 📂 Struktur Direktori

app/               # Routing berbasis file menggunakan Expo Router v6 (setup minimal)  
app-example/       # Implementasi referensi dengan tab, tema, dan komponen  
src/               # Struktur utama sesuai tasklist.md:  
├── screens/       # Halaman utama aplikasi (HomeScreen, CategoryScreen, dll)  
├── components/    # Komponen UI yang dapat digunakan kembali  
├── db/            # Lapisan database SQLite  
├── context/       # Context React untuk state global  
├── utils/         # Fungsi bantu (helper functions)  
└── assets/        # Gambar, ikon, dan aset lainnya  

---

### 🧱 Skema Database (SQLite dengan expo-sqlite)

categories: id, name, percentage, balance  
transactions: id, type(income/expense), amount, category_id, note, date  
loans: id, name, amount, category_id, status(unpaid/half/paid), date  
-- Index: category_id, date (untuk meningkatkan performa query)  

---

## 💡 Logika Bisnis Utama

- **Pembagian Otomatis:** Pemasukan global dibagi ke kategori sesuai persentase (misalnya: Sedekah 10%, Belanja 40%, Tabungan 15%).  
- **Pemasukan per Kategori:** Bisa menambahkan pemasukan langsung ke satu kategori tanpa memengaruhi lainnya.  
- **Pencatatan Pinjaman:** Uang berkurang dari kategori saat dipinjam, dan kembali saat pembayaran.  
- **Offline-First:** Tidak menggunakan API eksternal — hanya SQLite lokal.

---

## ⚙️ Panduan Pengembangan

### 🧩 Standar Penulisan Kode

- **Bahasa:** TypeScript (mode strict diaktifkan).  
- **Navigasi:** Menggunakan Expo Router v6 (berbasis file).  
- **State:** React Context API + Hooks (useState, useEffect, useFocusEffect).  
- **Database:** Semua operasi SQLite menggunakan async/await + try/catch, serta menerapkan pagination (LIMIT/OFFSET).  
- **Komentar:** Gunakan Bahasa Indonesia untuk logika bisnis, dan Bahasa Inggris untuk komentar teknis.

---

### ⚡ Persyaratan Performa

- Target: Android 8 ke atas dengan RAM minimal 3GB.  
- Gunakan **lazy loading** atau **pagination** untuk data besar.  
- Gunakan **indexing** di kolom database yang sering diakses.  
- Optimalkan agar tetap cepat meski tanpa koneksi internet.

---

### 🎨 Konvensi UI/UX

- Warna: pastel lembut (biru muda, hijau muda).  
- Ikon: gunakan `@expo/vector-icons` dengan label teks.  
- Navigasi: bottom tabs atau drawer navigation.  
- Gunakan indikator loading untuk proses asinkron.  
- Desain harus responsif di berbagai ukuran layar Android.

---

## 🔄 Alur Kerja Utama dalam Pengembangan

### 🚀 Memulai Proyek

npm install  
npx expo start  
# Uji di emulator atau perangkat Android  

---

### 🧠 Operasi Database

- Semua operasi SQLite wajib menggunakan async/await dan memiliki penanganan error.  
- Gunakan `useFocusEffect()` untuk memperbarui data saat halaman aktif.  
- Terapkan pagination agar daftar transaksi tidak membuat aplikasi lambat.

---

### 🔁 Reset Proyek (Jika Diperlukan)

npm run reset-project  
# Memindahkan app-example sebagai referensi, lalu membuat app/ kosong untuk pengembangan baru  

---

## 🧩 Catatan Implementasi Penting

### 📊 Sistem Kategori

- Total persentase kategori **tidak boleh melebihi 100%**.  
- Saldo kategori diperbarui otomatis setiap transaksi.  
- Penghapusan kategori harus memastikan tidak ada transaksi yang masih terkait.

---

### 💸 Proses Transaksi

- **Pemasukan Global:** Dibagi otomatis ke semua kategori berdasarkan persentase.  
- **Pemasukan Khusus:** Hanya ditambahkan ke kategori yang dipilih.  
- **Pengeluaran:** Mengurangi saldo dari kategori terkait.  
- Selalu pastikan saldo kategori cukup sebelum melakukan pengeluaran.

---

### 🤝 Manajemen Pinjaman

- Saat membuat pinjaman: nominal dikurangi dari kategori sumber.  
- Saat pembayaran sebagian: sebagian saldo dikembalikan ke kategori asal.  
- Saat pembayaran penuh: saldo dikembalikan seluruhnya ke kategori asal.  
- Status pinjaman harus dilacak: unpaid → half → paid.

---

## 📁 Penamaan File & Organisasi

- **Screens:** Gunakan PascalCase, contoh: `CategoryScreen.tsx`.  
- **Components:** Gunakan PascalCase, contoh: `CategoryCard.tsx`.  
- **Utils:** Gunakan camelCase, contoh: `formatCurrency.ts`.  
- Jangan buat file sementara seperti `test.js`, `debug.js`, atau `temp.js`.  
- Komentar logika bisnis ditulis dalam Bahasa Indonesia, komentar teknis dalam Bahasa Inggris.

---

## 🧩 Dependensi & Versi yang Digunakan

- Expo SDK ~54.0  
- React 19.1.0  
- TypeScript ~5.9.2  
- expo-router ~6.0 (routing berbasis file)  
- expo-sqlite (untuk database lokal)  
- @react-navigation (untuk komponen navigasi)  
- react-native-chart-kit (untuk visualisasi statistik)

---

## 🧪 Pengujian & Validasi

- Uji semua operasi CRUD di perangkat/emulator Android nyata.  
- Verifikasi logika pembagian otomatis kategori (total dan persentase).  
- Uji pagination dengan data besar untuk memastikan performa tetap baik.  
- Pastikan aplikasi dapat berfungsi sepenuhnya tanpa koneksi internet.  
- Periksa tampilan agar tetap responsif di berbagai ukuran layar.

---

### 📘 Referensi
Gunakan file berikut sebagai referensi dan acuan utama pengembangan proyek:
- `aturan.md`
- `prompt.md`
- `tasklist.md`