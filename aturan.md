# ⚙️ **aturan.md – ATURAN PENGEMBANGAN PROYEK "Catatan Keuangan" (REACT EXPO + SQLITE)**

## 🎯 Tujuan Aturan

Dokumen ini berfungsi untuk mengatur cara kerja AI agar memahami konteks proyek dengan baik, menulis kode dengan struktur yang rapi, tidak membuat kode duplikat atau tidak relevan, serta mengikuti standar pengembangan yang efisien dan profesional.

---

## 🧱 **1. STRUKTUR PROYEK**

- Buat struktur proyek yang **jelas, rapi, dan mudah dipahami**.
- Setiap fitur utama harus berada di folder yang sesuai:
  - `/screens` → untuk halaman utama aplikasi
  - `/components` → untuk komponen UI yang bisa digunakan ulang
  - `/db` → untuk konfigurasi SQLite dan query database
  - `/context` → untuk state management (Context API)
  - `/utils` → untuk helper atau fungsi tambahan
- Gunakan nama file yang **deskriptif dan konsisten** (misal: `AddTransactionScreen.js`, bukan `test1.js`).
- Pastikan semua file dan folder menggunakan format **camelCase atau PascalCase** sesuai konteks (komponen pakai PascalCase).

---

## 🔍 **2. PENGELOLAAN FILE & CLEAN CODE**

- Jangan membuat file sementara seperti `test.js`, `debug.js`, atau `fix_versi2.js`.
- Jika perlu melakukan testing/debugging, **hapus file tersebut setelah implementasi benar**.
- **Gunakan file utama (master)** untuk hasil final.
- Tidak boleh ada file atau folder duplikat yang berfungsi sama.
- Semua kode harus memiliki **komentar singkat dalam Bahasa Indonesia** untuk menjelaskan fungsi penting.
- Hindari penggunaan kode “sementara” seperti `console.log` berlebihan — hapus setelah bug diperbaiki.
- Jangan buat kode baru hanya untuk menambal error — **pahami akar masalah dan perbaiki langsung di logika utama.**

---

## 🧩 **3. DATABASE & PERFORMA**

- Gunakan **SQLite (expo-sqlite)** sebagai database lokal.
- Pastikan tabel dibuat melalui `migrations.sql` dan dikelola di `database.js`.
- Gunakan **indexing** pada kolom yang sering diakses (`category_id`, `date`).
- Implementasikan **pagination / lazy load** untuk data besar agar tidak lag.
- Semua operasi database wajib menggunakan **async/await**.
- Gunakan **try/catch** di semua fungsi database untuk mencegah crash.
- Jangan melakukan full scan tabel secara terus-menerus tanpa batasan (gunakan `LIMIT + OFFSET`).

---

## 🧠 **4. PEMAHAMAN PROMPT & KONTEKS**

- Pahami isi `prompt.md` dan `tasklist.md` sebelum menulis kode.
- Baca seluruh **context proyek dan dependensi yang terinstal** sebelum membuat file baru.
- Jangan membuat fitur baru yang tidak disebut dalam prompt.
- Jika ada bagian yang ambigu, gunakan **logika paling realistis dan efisien** (hindari asumsi berlebihan atau “halusinasi” fitur).
- Jika prompt menyebut “gunakan SQLite”, jangan ganti ke Realm, AsyncStorage, atau API lain.
- Jika disebut “offline”, jangan menambahkan fitur koneksi API eksternal.
- Jangan ubah flow kerja utama tanpa alasan logis atau instruksi eksplisit.

---

## 🧰 **5. STANDAR PENGEMBANGAN KODE**

- Gunakan **React Hooks (useState, useEffect, useContext, useFocusEffect)** dengan benar.
- Hindari nested hooks atau fungsi di dalam render.
- Gunakan `Context API` untuk state global (kategori, transaksi, pinjaman).
- Gunakan komponen kecil dan reusable (Component-Based Architecture).
- Pisahkan logika bisnis dengan UI (misal: fungsi hitung disimpan di `/utils`, bukan di komponen).
- Pastikan setiap screen bisa diakses dari navigasi utama.

---

## 🧾 **6. PEMELIHARAAN TASKLIST**

- Selalu **update `tasklist.md`** setelah menyelesaikan satu bagian.
- Tandai dengan ✔️ untuk memudahkan tracking progres.
- Jika ada perubahan struktural besar, tambahkan catatan di bawah task terkait.
- Pastikan setiap commit logis dan memiliki deskripsi singkat (misal: `feat: tambah fitur pinjaman` atau `fix: perbaiki pagination transaksi`).

---

## ⚡ **7. ANTI-HALUSINASI RULE (KHUSUS UNTUK AI)**

> Aturan ini dibuat agar AI tidak membuat hal-hal yang tidak diminta.

- Jangan membuat:
  - Fungsi, file, atau komponen yang tidak disebutkan dalam `prompt.md` atau `tasklist.md`.
  - Halaman login, register, notifikasi, atau API eksternal (kecuali diminta).
  - Komentar “roleplay” atau narasi non-teknis.
  - Kode pseudo atau komentar yang tidak implementatif.
- Fokus hanya pada fitur:
  - **Kategori, Transaksi, Pinjaman, Statistik, Splash Screen**
- Gunakan nama proyek yang konsisten: **CatatKu**
- Pastikan hasil akhir bisa dijalankan dengan perintah:`npx expo start`
- Jangan ubah arsitektur proyek tanpa alasan kuat.
- Jika ada kebingungan, prioritas utama adalah:

1. Keamanan data
2. Kinerja aplikasi
3. Kemudahan pengguna

---

## 🧩 **8. VALIDASI & TESTING**

- Setelah selesai tiap fitur:
- Jalankan aplikasi (`npx expo start`)
- Tes di emulator Android
- Pastikan tidak ada error di console
- Tes seluruh fungsi database:
- Tambah data
- Edit data
- Hapus data
- Filter data
- Pastikan UI tetap responsif dan tidak lag saat scroll panjang.
- Gunakan data dummy yang realistis untuk uji coba.

---

## 🧠 **9. STABILITAS & KOMPATIBILITAS**

- Pastikan aplikasi bisa berjalan di Android versi 8 ke atas.
- Optimalkan agar tetap lancar di device RAM 3GB.
- Hindari library besar yang tidak diperlukan.
- Pastikan tidak ada warning atau deprecated API di log terminal Expo.
- Gunakan library versi terbaru yang stabil.

---

## 🎯 **10. PENUTUP**

Tujuan utama proyek ini:

> Membangun aplikasi pencatat keuangan **offline**, ringan, stabil, dan mudah digunakan oleh pengguna umum.

Jaga kualitas kode, hindari duplikasi, pahami prompt dengan baik, dan pastikan seluruh fitur berjalan sempurna sebelum deployment.

---

**Catatan tambahan:**  
Jika AI tidak memahami konteks, baca ulang `prompt.md` & `tasklist.md` sebelum melakukan generate kode baru.
