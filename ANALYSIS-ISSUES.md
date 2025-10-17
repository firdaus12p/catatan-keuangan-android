# 🔍 Analisis Codebase - Issues & Optimizations

**Tanggal**: 18 Oktober 2025
**Status**: Audit Lengkap

## 🚨 CRITICAL ISSUES

### 1. **Notification System - Memory Leak Potensial**

📍 **File**: `src/utils/notificationHelper.ts`
📍 **Line**: 230-245 (setupNotificationListener)

**Problem**:

```typescript
const setupNotificationListener = async (settings: NotificationSettings) => {
  const subscription = notificationModule.addNotificationReceivedListener(
    () => {
      setTimeout(() => {
        scheduleNotification(settings);
      }, 1000);
    }
  );
  return subscription; // ⚠️ TIDAK PERNAH DI-CLEANUP!
};
```

**Impact**: Memory leak karena listener tidak pernah di-unsubscribe
**Severity**: HIGH
**Solution**: Store subscription dan cleanup saat app unmount

---

### 2. **Android Notification - Tidak Reliable**

📍 **File**: `src/utils/notificationHelper.ts`  
📍 **Line**: 205-220

**Problem**:

- Android menggunakan `TIME_INTERVAL` non-repeating
- Reschedule manual via listener (tidak reliable jika app dikill)
- iOS menggunakan `CALENDAR` repeating (bekerja lebih baik)

**Impact**: Notifikasi Android bisa gagal setelah pertama kali
**Severity**: HIGH  
**Solution**: Gunakan AlarmManager native untuk Android atau gunakan CALENDAR trigger

---

## ⚠️ CODE DUPLICATION

### 3. **Alert.alert Patterns - 80+ Occurrences**

**Files Affected**:

- `CategoryScreen.tsx` - 13 alerts
- `AddTransactionScreen.tsx` - 6 alerts
- `LoanScreen.tsx` - 12 alerts
- `NotificationScreen.tsx` - 10 alerts
- `ResetScreen.tsx` - 4 alerts

**Problem**: Pola yang sama diulang berkali-kali:

```typescript
Alert.alert("Error", "Pesan error");
Alert.alert("Sukses", "Pesan sukses");
```

**Solution**: Buat utility `src/utils/alertHelper.ts`:

```typescript
export const showError = (message: string) => Alert.alert("Error", message);
export const showSuccess = (message: string) => Alert.alert("Sukses", message);
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void
) => {
  Alert.alert(title, message, [
    { text: "Batal", style: "cancel" },
    { text: "OK", onPress: onConfirm },
  ]);
};
```

---

### 4. **Timezone Checking Duplicated**

📍 **Files**:

- `notificationHelper.ts` - `getDeviceTimezone()`
- `NotificationScreen.tsx` - Line 65-73

**Problem**: Logic timezone check ada di 2 tempat
**Solution**: Centralize di helper saja

---

### 5. **formatTimeForDisplay Called Multiple Times**

📍 **File**: `NotificationScreen.tsx`
📍 **Lines**: 235, 237

**Problem**:

```typescript
subtitle: settings.isEnabled
  ? `Pengingat harian pada pukul ${formatTimeForDisplay(settings.time)}`  // Call 1
  : "Tidak ada pengingat yang dijadwalkan",

// Later...
description={`Setiap hari pada pukul ${notificationStatus.displayTime}`}  // Using memoized value
```

**Solution**: ✅ Already using useMemo, but can be improved by pre-calculating in loadSettings

---

## 🎯 OPTIMIZATION OPPORTUNITIES

### 6. **HomeScreen - Unnecessary State**

📍 **File**: `HomeScreen.tsx`

**Current**:

```typescript
const [summarySnapshot, setSummarySnapshot] = useState<{
  totalSaldo: number;
  saldoBersih: number;
} | null>(null);
```

**Problem**: Bisa diganti dengan useMemo
**Solution**:

```typescript
const displayStats = useMemo(
  () => ({
    totalSaldo:
      selectedPeriod === "current"
        ? monthlyStats.totalSaldo
        : previousStats.totalSaldo,
    saldoBersih:
      selectedPeriod === "current"
        ? monthlyStats.saldoBersih
        : previousStats.saldoBersih,
  }),
  [selectedPeriod, monthlyStats, previousStats]
);
```

---

### 7. **Validation Logic Duplication**

**Files**:

- `CategoryScreen.tsx` - Line 134-140
- `AddTransactionScreen.tsx` - Line 206-218
- `LoanScreen.tsx` - Line 343-354

**Problem**: Validation pattern yang sama diulang:

```typescript
if (!amount || amount <= 0) {
  Alert.alert("Error", "Jumlah harus lebih dari 0");
  return;
}
```

**Solution**: Buat `src/utils/validationHelper.ts`:

```typescript
export const validatePositiveAmount = (amount: number): boolean => {
  if (!amount || amount <= 0) {
    showError("Jumlah harus lebih dari 0");
    return false;
  }
  return true;
};
```

---

### 8. **Error Handling Pattern Duplication**

**Pattern yang diulang di banyak file**:

```typescript
} catch (error) {
  console.error("Error loading X:", error);
  Alert.alert("Error", "Gagal memuat X");
}
```

**Solution**: Buat error handler utility:

```typescript
export const handleError = (
  error: unknown,
  context: string,
  userMessage?: string
) => {
  console.error(`Error in ${context}:`, error);
  const message = userMessage || `Gagal ${context}`;
  showError(message);
};
```

---

### 9. **Date Formatting Duplication**

**Files**: Multiple screens format dates similarly

**Solution**: Centralize in `src/utils/dateHelper.ts` (already exists, but can be enhanced):

```typescript
export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
```

---

### 10. **Category Selection Logic Duplication**

📍 **Files**:

- `AddTransactionScreen.tsx`
- `LoanScreen.tsx`
- `CategoryScreen.tsx`

**Problem**: Modal selection pattern diulang
**Solution**: Buat reusable `<CategoryPickerModal>` component

---

## 📊 CLEAN CODE IMPROVEMENTS

### 11. **Magic Numbers**

**Examples**:

```typescript
// HomeScreen.tsx
await new Promise((resolve) => setTimeout(resolve, 2000)); // ❌

// Better:
const SPLASH_DELAY_MS = 2000;
await new Promise((resolve) => setTimeout(resolve, SPLASH_DELAY_MS)); // ✅
```

---

### 12. **Long Functions**

📍 **File**: `AddTransactionScreen.tsx`
📍 **Function**: `handleAddTransaction` - 150+ lines

**Solution**: Break into smaller functions:

```typescript
const validateTransaction = () => {
  /* validation logic */
};
const createTransactionObject = () => {
  /* object creation */
};
const saveTransaction = async () => {
  /* save logic */
};
```

---

### 13. **Nested Ternaries**

**Example**:

```typescript
const status =
  loan.status === "paid"
    ? "Lunas"
    : loan.status === "half"
    ? "Sebagian"
    : "Belum Lunas"; // ❌ Hard to read
```

**Better**:

```typescript
const STATUS_LABELS = {
  paid: "Lunas",
  half: "Sebagian",
  unpaid: "Belum Lunas",
};
const status = STATUS_LABELS[loan.status]; // ✅ Clean
```

---

## ✅ GOOD PRACTICES FOUND

1. ✅ **React.memo** properly used in new components
2. ✅ **useCallback** untuk event handlers
3. ✅ **useMemo** untuk computed values
4. ✅ **InteractionManager** untuk smooth UI
5. ✅ **Promise.all** untuk parallel queries
6. ✅ **TypeScript** strict mode
7. ✅ **Error boundaries** dengan try-catch
8. ✅ **Lazy imports** untuk expo-notifications

---

## 🎯 PRIORITY FIXES

### Priority 1 (HIGH) - Safety Issues

1. ⚠️ Fix notification listener memory leak
2. ⚠️ Fix Android notification reliability

### Priority 2 (MEDIUM) - Code Quality

3. 🔧 Create alertHelper utility
4. 🔧 Create validationHelper utility
5. 🔧 Extract magic numbers to constants

### Priority 3 (LOW) - Refactoring

6. 📝 Break long functions into smaller ones
7. 📝 Create reusable CategoryPicker component
8. 📝 Enhance dateHelper utilities

---

## 📝 RECOMMENDATIONS

### Immediate Actions:

1. **Fix notification system** (memory leak + Android reliability)
2. **Create utility helpers** (alert, validation, error handling)
3. **Extract constants** (magic numbers)

### Future Improvements:

1. Consider React Query for data fetching
2. Add unit tests for critical functions
3. Implement error boundary component
4. Add performance monitoring (Firebase Performance)

---

**Next Steps**: Apply fixes dengan hati-hati, satu per satu, dengan testing setelah setiap perubahan.
