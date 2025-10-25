# Changelog

All notable changes to Kemenku (Aplikasi Keuangan Pribadi) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-18

### 🎉 Initial Release

**Kemenku** - Aplikasi pencatat keuangan pribadi offline-first dengan distribusi pendapatan otomatis.

### ✨ Features

#### 📊 Manajemen Keuangan

- **Distribusi Pendapatan Otomatis**: Distribusikan pendapatan global ke kategori berdasarkan persentase
- **Pencatatan Transaksi**:
  - Pemasukan global (didistribusikan ke semua kategori)
  - Pemasukan langsung ke kategori spesifik
  - Pengeluaran dengan validasi saldo kategori
  - History transaksi dengan pagination
- **Kategori Keuangan**:
  - 6 kategori default (dapat disesuaikan)
  - Alokasi persentase fleksibel (total max 100%)
  - Pelacakan saldo per kategori
  - Transfer saldo antar kategori

#### 💰 Manajemen Pinjaman

- Pencatatan pinjaman keluar dengan kategori sumber dana
- 3 status pinjaman: Belum Dibayar, Setengah Dibayar, Lunas
- Pembayaran pinjaman sebagian atau penuh
- History pembayaran pinjaman
- Otomatis update saldo kategori saat pembayaran

#### 📈 Statistik & Visualisasi

- Dashboard dengan ringkasan keuangan:
  - Total pemasukan & pengeluaran per periode
  - Saldo bersih kategori
  - Total pinjaman outstanding
- Grafik visualisasi:
  - Bar chart pemasukan vs pengeluaran
  - Pie chart distribusi saldo kategori
- Filter periode: Bulan Ini, Tahun Ini, Sepanjang Waktu
- Breakdown pengeluaran berdasarkan jenis

#### 🔔 Sistem Notifikasi

- Pengingat harian untuk mencatat pengeluaran
- Konfigurasi waktu notifikasi custom (format 24 jam)
- Auto-detect timezone perangkat
- Support Android & iOS dengan approach berbeda
- Persistence settings dengan AsyncStorage

#### 🎨 User Interface

- Material Design dengan React Native Paper
- Animasi count-up untuk angka finansial
- Floating Action Button untuk quick access
- Dark mode support (automatic)
- Edge-to-edge design untuk Android modern
- Splash screen dengan delay 2 detik

#### 🗄️ Database & Persistence

- SQLite offline-first database
- 5 tabel: categories, transactions, expense_types, loans, loan_payments
- Database migration system
- Auto-index untuk optimasi query
- Data persistence 100% offline

### 🚀 Performance Optimizations

#### Component-Level

- React.memo pada 7+ komponen besar
- useMemo untuk computed values (10+ usages)
- useCallback untuk callbacks (20+ usages)
- Custom comparison functions untuk chart re-render prevention

#### Database-Level

- Promise.all untuk parallel query execution
- LIMIT/OFFSET pagination untuk transactions
- 3 strategic indexes:
  - `idx_category_id` untuk JOIN optimization
  - `idx_date` untuk date range queries
  - `idx_expense_type_id` untuk expense type filtering
- Optimized `getMonthlyStats`: 2 queries → 1 query (conditional SUM)

#### List Rendering

- FlatList optimization di 3 screens:
  - maxToRenderPerBatch: 8-10
  - windowSize: 5
  - removeClippedSubviews: true
  - initialNumToRender: 8-10
  - updateCellsBatchingPeriod: 50ms

#### Memory Management

- Notification listener cleanup dengan useEffect
- No memory leaks detected
- Proper cleanup functions di semua useEffect hooks

### 🛠️ Technical Stack

**Framework & Tools:**

- React Native 0.81.4
- React 19.1.0 (dengan React Compiler experimental)
- Expo SDK 54.0.13
- Expo Router v6 (file-based routing dengan typed routes)
- TypeScript 5.9.2 (strict mode)

**Key Dependencies:**

- expo-sqlite 16.0.8 (database)
- react-native-paper 5.14.5 (UI components)
- react-native-chart-kit 6.12.0 (visualizations)
- expo-notifications 0.32.12 (notifications)
- @react-native-async-storage/async-storage 2.2.0 (persistence)

**Build Configuration:**

- Android package: `com.firdaus12p.kemenku`
- Version code: 1
- New Architecture enabled
- React Compiler experimental enabled
- Edge-to-edge Android UI

### 🏗️ Code Quality

**Best Practices:**

- ✅ TypeScript strict mode enabled
- ✅ ESLint configured (expo preset)
- ✅ No compilation errors
- ✅ Helper utilities:
  - alertHelper.ts (6 functions)
  - validationHelper.ts (5 functions)
  - dateHelper.ts (date formatting)
  - formatCurrency.ts (currency formatting)
- ✅ Constants extracted to constants.ts (7 categories)
- ✅ Console.log wrapped dengan **DEV** checks

**Testing:**

- Manual testing pada Android device/emulator
- Tested dengan dataset besar (100+ transactions)
- Memory profiling dengan Android Studio Profiler
- Performance monitoring dengan Expo Performance Monitor

### 📱 Platform Support

**Android:**

- Minimum SDK: Auto (dari Expo)
- Target SDK: Auto (dari Expo)
- Permissions:
  - RECEIVE_BOOT_COMPLETED (notifikasi)
  - SCHEDULE_EXACT_ALARM (exact timing)
  - WAKE_LOCK (notifikasi saat sleep)
- Adaptive icon dengan monochrome variant
- Edge-to-edge UI support

**iOS:**

- Support tablet
- Calendar-based repeating notifications

### 📖 Documentation

**Project Documentation:**

- README.md - Project overview & setup
- CHANGELOG.md - Version history (this file)
- BUILD.md - Complete build instructions
- aturan.md - Development rules & guidelines
- prompt.md - Original project specifications

**Development Documentation:**

- ANALYSIS-ISSUES.md - Code audit results
- OPTIMIZATION_REPORT.md - Performance optimizations
- status_pengembangan.md - Development status

### 🐛 Known Issues & Limitations

**Notification System:**

- Android: Non-repeating notifications (need manual reschedule)
- Expo Go: Limited notification support (use dev build)
- Notifications bisa gagal jika app force-killed sebelum reschedule

**Platform Differences:**

- Android: TIME_INTERVAL trigger (less reliable)
- iOS: CALENDAR trigger (more reliable, auto-repeat)

### 🔮 Future Improvements (Planned)

**Feature Enhancements:**

- [ ] Export data ke CSV/PDF
- [ ] Import data dari file
- [ ] Backup & restore ke cloud
- [ ] Multiple user profiles
- [ ] Biometric authentication
- [ ] Dark theme toggle manual

**Technical Improvements:**

- [ ] Unit tests dengan Jest
- [ ] Integration tests
- [ ] E2E tests dengan Detox
- [ ] AlarmManager untuk Android notifications (more reliable)
- [ ] React Query untuk advanced state management
- [ ] Sentry untuk error tracking

**UX Improvements:**

- [ ] Onboarding tutorial
- [ ] Empty state illustrations
- [ ] Pull-to-refresh
- [ ] Haptic feedback
- [ ] Custom animations

---

## Version History

### [1.0.0] - 2025-10-18

- 🎉 Initial production release
- ✨ Complete feature set
- 🚀 Performance optimized
- 📱 Android build ready

---

**Maintained by:** Firdaus12p  
**License:** Private  
**Platform:** Android (React Native Expo)
