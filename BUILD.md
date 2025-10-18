# 🏗️ Build Instructions - Kemenku

Panduan lengkap untuk build aplikasi Kemenku untuk Android.

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 atau lebih tinggi)
2. **Expo CLI**: `npm install -g expo-cli`
3. **Android Studio** (untuk development build)
4. **Java Development Kit (JDK)** - Version 17

### Environment Setup

#### Windows:

```powershell
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

#### Linux/macOS:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

---

## 🚀 Build Methods

### Method 1: Development Build (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Prebuild
npm run prebuild

# 3. Build & run
npm run android:build
```

### Method 2: Release Build (Local)

```bash
# 1. Clean prebuild
npm run prebuild:clean

# 2. Build release
npm run android:release
```

**Generate Signed APK:**

1. Generate Keystore:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore kemenku-release-key.keystore -alias kemenku-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Edit `android/gradle.properties`:

```properties
KEMENKU_RELEASE_STORE_FILE=kemenku-release-key.keystore
KEMENKU_RELEASE_KEY_ALIAS=kemenku-key-alias
KEMENKU_RELEASE_STORE_PASSWORD=your_password
KEMENKU_RELEASE_KEY_PASSWORD=your_password
```

3. Build:

```bash
cd android
./gradlew assembleRelease
```

**Output**: `android/app/build/outputs/apk/release/app-release.apk`

### Method 3: EAS Build (Cloud)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure
eas build:configure

# 4. Build
eas build --profile production --platform android
```

---

## 📦 Build Scripts

```bash
npm start                 # Start development server
npm run start:clean       # Start with clear cache
npm run android:build     # Development build
npm run android:release   # Release build
npm run type-check        # TypeScript check
npm run prebuild          # Generate native folders
npm run prebuild:clean    # Clean prebuild
```

---

## 🧪 Testing Build

### Pre-Build Checklist:

```bash
npm run type-check        # Check TypeScript
npm run lint              # Check lint
npm start                 # Test in development
```

### Post-Build Testing:

- [ ] App launches successfully
- [ ] No crash on startup
- [ ] All screens accessible
- [ ] Transactions work
- [ ] Notifications work
- [ ] Data persists after restart

---

## 🐛 Troubleshooting

**Issue: "SDK location not found"**

```bash
echo "sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk" > android/local.properties
```

**Issue: "Gradle build failed"**

```bash
cd android
./gradlew clean
```

**Issue: "Notification not working"**

- Notifikasi tidak berfungsi di Expo Go
- Gunakan development build atau production build

---

## 📱 Installation

### Via USB:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via File Transfer:

1. Copy APK ke device
2. Install dari file manager

---

## 🎉 Production Checklist

### Code Quality:

- [x] No TypeScript errors
- [x] No console.log in production
- [x] All features tested

### Build Configuration:

- [x] Package name: `com.firdaus12p.kemenku`
- [x] Version code: `1`
- [x] Version: `1.0.0`
- [x] Icons configured
- [x] Permissions configured

### Testing:

- [ ] Tested on multiple devices
- [ ] Memory leak testing
- [ ] Performance testing
- [ ] Notification testing

---

## 🔐 Security

- [ ] Keystore backed up securely
- [ ] Passwords in password manager
- [ ] `gradle.properties` in .gitignore
- [ ] No sensitive data in logs

---

**Last Updated:** October 18, 2025  
**Status:** ✅ Production Ready
