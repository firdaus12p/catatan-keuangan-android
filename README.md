# 💸 Kemenku - Aplikasi Catatan Keuangan Pribadi

Aplikasi keuangan pribadi offline-first untuk Android dengan fokus pada **distribusi pendapatan otomatis berbasis kategori**.

## ⚠️ PENTING: Expo Go TIDAK Didukung!

Aplikasi ini menggunakan `expo-sqlite` (native module) yang **TIDAK BERFUNGSI di Expo Go**.

❌ **JANGAN** scan QR code dengan Expo Go  
✅ **HARUS** build development APK terlebih dahulu

## 🚀 Cara Menjalankan

### Prerequisites

- Node.js 18+
- Android Studio (untuk Android SDK & emulator)
- JDK 17+ (biasanya sudah termasuk di Android Studio)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Android (Pertama Kali)

```bash
# Generate folder android
npx expo prebuild

# Buat file android/local.properties dengan SDK path
# Windows:
echo sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk > android/local.properties

# macOS/Linux:
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### Step 3: Build & Run

**Option A: Development Build (Recommended)**
```bash
npx expo run:android
```

**Option B: Build APK Manual**
```bash
cd android
./gradlew assembleDebug
# APK di: android/app/build/outputs/apk/debug/app-debug.apk
# Install ke device/emulator
```

**Option C: Production Build**
```bash
cd android
./gradlew assembleRelease
# APK di: android/app/build/outputs/apk/release/app-release.apk
```

## 🐛 Troubleshooting

### Error: "Database not initialized"
- **Penyebab**: Menggunakan Expo Go
- **Solusi**: Build APK dengan `npx expo run:android`

### Error: "<<<<<<< HEAD" atau merge conflicts
- **Penyebab**: Unresolved git merge conflicts
- **Solusi**: Lihat [MERGE_CONFLICT_FIX.md](MERGE_CONFLICT_FIX.md)

### Error: "SDK location not found"
- **Solusi**: Buat file `android/local.properties` dengan path SDK Android Anda

### Error: "JAVA_COMPILER not found"
- **Solusi**: Set JDK path di `android/gradle.properties`:
  ```
  org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr
  ```

Untuk troubleshooting lengkap, lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📱 Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Navigation**: Expo Router v6 (file-based)
- **Database**: expo-sqlite (local SQLite)
- **UI**: React Native Paper
- **Language**: TypeScript 5.9

## 📄 Dokumentasi

- [BUILD.md](BUILD.md) - Panduan build lengkap
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solusi masalah umum
- [CHANGELOG.md](CHANGELOG.md) - Riwayat perubahan
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - Dokumentasi teknis lengkap

## 📝 License

MIT License
