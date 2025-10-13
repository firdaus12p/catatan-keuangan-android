# 🔧 Troubleshooting Splash Screen - CatatKu

## 🚨 **Masalah Reported:**

Splash screen aplikasi belum berubah, masih menampilkan icon dan teks "kemenku" yang lama.

## ✅ **Yang Sudah Dilakukan:**

### 1. **Verifikasi File Logo:**

- ✅ `splash-icon.png` sudah ada di `assets/images/`
- ✅ File size: 7.62 KB (optimal)
- ✅ Last modified: 13/10/2025 4:34:39 PM (file baru)

### 2. **Update Konfigurasi app.json:**

```json
{
  "name": "CatatKu", // ← Diganti dari "catatan-keuangan"
  "splash": {
    // ← Ditambahkan konfigurasi splash eksplisit
    "image": "./assets/images/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#E6F4FE",
    "imageWidth": 150
  },
  "plugins": [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 150,
        "resizeMode": "contain",
        "backgroundColor": "#E6F4FE",
        "dark": {
          "image": "./assets/images/splash-icon.png",
          "backgroundColor": "#1E3A8A"
        }
      }
    ]
  ]
}
```

### 3. **Clear Cache Lengkap:**

- ✅ Hapus folder `.expo` cache
- ✅ Clear Metro bundler cache
- ✅ Restart Expo dengan `--clear` flag
- ✅ Install ulang expo-splash-screen

## 📱 **Langkah Selanjutnya untuk Test:**

### **Untuk Android (Expo Go):**

1. **Scan QR code baru** di terminal
2. **Force close** aplikasi Expo Go di device
3. **Restart aplikasi** dengan scan QR code lagi
4. **Lihat splash screen** saat loading pertama kali

### **Untuk Development Build:**

```bash
# Build APK baru untuk test
npx expo build:android
```

### **Jika Masih Belum Berubah:**

1. **Cek ukuran file splash-icon.png:**

   ```bash
   Get-Item "assets\images\splash-icon.png" | Select Length
   ```

2. **Backup dan replace manual:**

   ```bash
   # Backup file lama
   copy assets\images\splash-icon.png assets\images\splash-icon-backup.png

   # Copy file baru dengan konfirmasi
   copy assets\logo-templates\splash-icon.png assets\images\splash-icon.png /Y
   ```

3. **Restart device/emulator** sepenuhnya

4. **Test dengan build APK production:**
   ```bash
   npx expo build:android --clear-cache
   ```

## 🎯 **Kemungkinan Penyebab:**

1. **Cache Expo Go:** App masih menggunakan cache lama
2. **Development vs Production:** Splash screen mungkin berbeda di build production
3. **File corruption:** File splash-icon.png corrupt saat upload
4. **Platform specific:** Android mungkin perlu konfigurasi tambahan

## 🔄 **Status Sekarang:**

- ✅ Konfigurasi sudah benar
- ✅ File sudah di tempat yang tepat
- ✅ Cache sudah di-clear
- ✅ Expo server running di port 8082
- 🟡 **Perlu test di device dengan scan QR code baru**

## 💡 **Tips:**

- **Force close** aplikasi di device sebelum scan QR code baru
- **Tunggu splash screen** saat loading pertama kali
- **Jika masih belum berubah**, coba build APK production untuk test final
