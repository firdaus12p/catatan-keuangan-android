# 🎨 Logo Requirements untuk Aplikasi CatatKu

## 📋 Daftar File Logo yang Dibutuhkan

### 1. **icon.png** (Icon Utama)

- **Ukuran:** 1024x1024 pixel
- **Format:** PNG
- **Keterangan:** Icon utama aplikasi untuk iOS dan fallback Android
- **Tips:** Buat desain sederhana yang terlihat jelas bahkan dalam ukuran kecil

### 2. **android-icon-foreground.png** (Android Foreground)

- **Ukuran:** 432x432 pixel
- **Format:** PNG dengan background transparan
- **Safe Zone:** Pastikan elemen penting logo berada dalam area 288x288px di tengah
- **Keterangan:** Bagian depan adaptive icon Android
- **Tips:** Jangan terlalu detail, fokus pada elemen utama logo

### 3. **android-icon-background.png** (Android Background)

- **Ukuran:** 432x432 pixel
- **Format:** PNG
- **Warna:** Sesuai tema aplikasi (saat ini: #E6F4FE - biru muda)
- **Keterangan:** Background untuk adaptive icon Android
- **Tips:** Bisa solid color atau pattern sederhana

### 4. **android-icon-monochrome.png** (Android Monochrome)

- **Ukuran:** 432x432 pixel
- **Format:** PNG hitam putih (grayscale)
- **Keterangan:** Versi monokrom untuk themed icons Android 13+
- **Tips:** Gunakan hanya hitam (#000000) dan transparan

### 5. **splash-icon.png** (Splash Screen)

- **Ukuran:** 200x200 pixel (bisa sampai 400x400)
- **Format:** PNG dengan background transparan
- **Keterangan:** Logo yang muncul di splash screen saat loading
- **Tips:** Versi sederhana dari logo utama

### 6. **favicon.png** (Web Favicon)

- **Ukuran:** 48x48 pixel
- **Format:** PNG
- **Keterangan:** Icon untuk versi web aplikasi
- **Tips:** Versi sangat sederhana, hanya elemen kunci logo

## 🎨 Panduan Desain Logo CatatKu

### Tema Aplikasi:

- **Nama:** CatatKu (Aplikasi Catatan Keuangan)
- **Warna Utama:** Biru (#2196F3) dan biru muda (#E6F4FE)
- **Konsep:** Pencatatan keuangan, sederhana, terpercaya
- **Target:** Personal finance, Indonesia

### Saran Elemen Logo:

- 💰 Simbol uang/koin
- 📝 Simbol pencatatan/notes
- 📊 Simbol chart/grafik
- 🏦 Simbol keuangan
- Kombinasi huruf "C" dan "K" untuk CatatKu

### Panduan Teknis:

1. **Format File:** PNG dengan kualitas tinggi
2. **Background:** Transparan untuk foreground icons
3. **Warna:** Konsisten dengan tema aplikasi
4. **Keterbacaan:** Harus jelas terlihat dalam ukuran kecil
5. **Sederhana:** Hindari detail berlebihan

## 📁 Cara Upload Logo

1. Buat/edit logo sesuai spesifikasi di atas
2. Simpan dengan nama file yang tepat
3. Replace file-file di folder `assets/images/` dengan logo baru
4. Jalankan `npx expo start` untuk melihat perubahan
5. Untuk build production, pastikan semua file logo sudah benar

## 🔄 Setelah Upload Logo

Jalankan command berikut untuk me-refresh cache:

```bash
npx expo start --clear
```

Untuk test build Android:

```bash
npx expo build:android
```
