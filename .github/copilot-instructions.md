# ⚙️ Instruksi GitHub Copilot untuk Kemenku (Aplikasi Keuangan Pribadi)

## 🎯 Gambaran Proyek

**Kemenku** adalah aplikasi keuangan pribadi offline-first untuk Android dengan fokus pada **distribusi pendapatan otomatis berbasis kategori**. Dibangun dengan React Native Expo SDK 54, React 19, TypeScript 5.9, dan SQLite lokal.

**Prinsip Arsitektur Utama:**

- **Offline-first**: Semua data tersimpan lokal di SQLite, zero network dependency
- **Single Context Pattern**: `AppContext` sebagai satu-satunya global state dengan optimization split state/functions
- **Database Singleton**: Class `Database` di `database.ts` dengan auto-migration dan connection pooling
- **File-based Routing**: Expo Router v6 dengan struktur `app/(tabs)/` untuk tab navigation
- **Custom Hooks Pattern**: Business logic extracted ke reusable hooks (e.g., `useAllocationValidator`)

## 🗂️ Struktur Codebase

```
app/                              # Expo Router v6 - File-based routing
├── (tabs)/                       # Tab navigation group (5 tabs)
│   ├── _layout.tsx              # Tab bar config dengan FloatingActionButtons
│   ├── index.tsx                # HomeScreen (dashboard)
│   ├── transaction.tsx          # TransactionScreen
│   ├── category.tsx             # CategoryScreen
│   ├── loan.tsx                 # LoanScreen
│   └── notification.tsx         # NotificationScreen
├── _layout.tsx                  # Root layout dengan AppProvider & Notifications
└── index.tsx                    # Splash screen (2s delay → redirect)

src/
├── context/AppContext.tsx       # Global state - OPTIMIZED split pattern
├── db/database.ts               # SQLite singleton - Core business logic
├── screens/                     # Screen components (linked via router)
├── components/                  # Reusable UI components
│   ├── FloatingActionButtons.tsx  # Global FAB dengan React.memo optimization
│   ├── ExpenseCharts.tsx        # Category distribution chart only
│   ├── FinancialSummary.tsx     # Monthly/period financial overview
│   ├── CategoryBalanceCard.tsx  # Selected category balance display
│   └── ExpenseTypeHighlight.tsx # Expense type breakdown component
├── hooks/                       # Custom hooks for reusable logic
│   └── useAllocationValidator.ts  # Validation hook (DRY principle)
├── styles/commonStyles.ts       # Centralized color & style constants
└── utils/                       # Pure functions
    ├── allocation.ts            # Allocation calculation constants
    ├── validationHelper.ts      # Form validation utilities
    ├── formatCurrency.ts        # Currency formatting (no decimals)
    ├── constants.ts             # App-wide constants (TIMING, etc.)
    └── notificationHelper.ts    # Notification management
```

## 🗄️ Database Schema (SQLite dengan expo-sqlite)

```sql
-- Core Tables
categories (id, name, percentage, balance)
  -- percentage: alokasi % dari pendapatan global (total ≤100%)
  -- balance: saldo berjalan yang berubah per transaksi

transactions (id, type, amount, category_id, note, date, expense_type_id)
  -- type: 'income' | 'expense' (CHECK constraint)
  -- expense_type_id: nullable FK ke expense_types

loans (id, name, amount, category_id, status, date, note)
  -- status: 'unpaid' | 'half' | 'paid'
  -- amount dikurangi dari category balance saat dibuat
  -- note: catatan pinjaman (added recently)

loan_payments (id, loan_id, amount, payment_date, remaining_amount)
  -- Tracking pembayaran partial loan

expense_types (id, name, total_spent, created_at)
  -- total_spent: aggregate dari transactions

-- Indexes (performance critical)
CREATE INDEX idx_category_id ON transactions(category_id);
CREATE INDEX idx_date ON transactions(date);
CREATE INDEX idx_expense_type_id ON transactions(expense_type_id);
```

**Database Pattern:**

- `database.ts` exports singleton instance: `export const database = new Database();`
- Auto-initialization dengan `ensureInitialized()` sebelum setiap operasi
- Migration system: `addColumnIfNotExists()`, `tableHasColumn()`
- Error validation: Throws descriptive errors instead of silent failures

## 🧠 State Management Pattern (CRITICAL)

### AppContext Optimization (Split Pattern)

```typescript
// ⚡ SPLIT PATTERN untuk reduce re-renders
const stateValue = useMemo(
  () => ({
    categories,
    expenseTypes,
    transactions,
    loans,
    monthlyStats,
    totalAllTimeBalance,
    loading,
  }),
  [
    categories,
    expenseTypes,
    transactions,
    loans,
    monthlyStats,
    totalAllTimeBalance,
    loading,
  ]
);

const functionsValue = useMemo(
  () => ({
    loadCategories,
    addCategory,
    loadTransactions,
    addTransaction,
    // ... all 35+ functions
  }),
  [loadCategories, addCategory /* ... all function deps */]
);

const value = useMemo(
  () => ({
    ...stateValue,
    ...functionsValue,
  }),
  [stateValue, functionsValue]
); // ✅ Only 2 deps!
```

### Screen Data Loading Pattern

```typescript
// ✅ PATTERN: useFocusEffect untuk auto-refresh saat screen aktif
useFocusEffect(
  React.useCallback(() => {
    const loadData = async () => {
      await loadCategories();
      await loadTransactions();
    };
    loadData();
  }, [loadCategories, loadTransactions])
);
```

### AsyncStorage Persistence Pattern

```typescript
// ✅ PATTERN: Persistent UI state across app restarts
useFocusEffect(
  React.useCallback(() => {
    const loadSavedSelection = async () => {
      try {
        const saved = await AsyncStorage.getItem("selectedCategoryIds");
        if (saved) {
          setSelectedCategoryIds(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading saved selection:", error);
      }
    };
    loadSavedSelection();
  }, [])
);

// Save on change
const handleCategoryToggle = useCallback(async (categoryId: number) => {
  // ... toggle logic
  await AsyncStorage.setItem(
    "selectedCategoryIds",
    JSON.stringify(newSelection)
  );
}, []);
```

## 💰 Logika Bisnis Inti

### 🎯 Sistem Kategori

- **Total alokasi ≤100%**: Sum of all `category.percentage` harus ≤100%
- **3 jenis pemasukan**:
  1. **Global Income**: `addGlobalIncome()` → dibagi sesuai percentage
  2. **Direct Income**: `addTransaction(type: "income")` → langsung ke 1 kategori
  3. **Multi-Category Income**: `addMultiCategoryIncome()` → split manual ke beberapa kategori

### 💸 Pemrosesan Transaksi & Error Handling

```typescript
// ✅ PATTERN: Descriptive error handling
const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  try {
    await database.addTransaction(transaction);
    await loadCategories();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Gagal menambahkan transaksi";
    showError(errorMessage); // Shows specific validation errors to user
  }
};

// Database validation examples:
// - "Tidak ada kategori. Buat kategori terlebih dahulu sebelum menambahkan transaksi."
// - "Saldo kategori tidak mencukupi"
```

### 🤝 Manajemen Pinjaman dengan Catatan

- **Create loan**: Mengurangi `category.balance` + optional note field
- **Pay loan**: Mengembalikan uang ke `category.balance` + tracking di `loan_payments`
- **Status flow**: `unpaid` → `half` (partial payment) → `paid` (fully paid)
- **Display pattern**: Shows note with 📝 emoji when available

### 🔔 Masalah Notifikasi (Known Issue)

**CRITICAL**: Notifikasi tidak berfungsi dengan baik karena:

```typescript
// ⚠️ ISSUE: expo-notifications tidak kompatibel dengan Expo Go
const isNotificationSupported = () => {
  const isExpoGo = __DEV__ && global.expo?.modules?.ExpoGo;
  return !isExpoGo && !Platform.OS === "web";
};

// Conditional import yang menyebabkan masalah
let Notifications: any = null;
const getNotifications = async () => {
  if (!Notifications && isNotificationSupported()) {
    Notifications = await import("expo-notifications");
  }
  return Notifications;
};
```

**Root Cause**:

1. Dynamic import `expo-notifications` kadang gagal di development build
2. Permission handling tidak konsisten across devices
3. Timezone handling complex untuk scheduling
4. Cleanup listener tidak dipanggil properly

**Solusi**:

- Gunakan **production build** untuk testing notifikasi
- Verifikasi permissions di device settings manually
- Check `notificationHelper.ts` line 363 `initializeNotifications()`

## ⚙️ Development Patterns & Conventions

### 🎨 UI/UX Patterns

```typescript
// ✅ SELALU gunakan colors dari commonStyles.ts
import { colors } from "../styles/commonStyles";

// ✅ Format currency: NO decimals (recently updated)
import { formatCurrency } from "../utils/formatCurrency";
const formatted = formatCurrency(150000); // "Rp150.000" (not "Rp150.000,00")

// ✅ Clickable labels pattern (TouchableOpacity wrapper)
<TouchableOpacity onPress={() => setSelected(value)} style={styles.radioItem}>
  <RadioButton value={value} />
  <Text>{label}</Text>
</TouchableOpacity>;
```

### 🏗️ Component Patterns

```typescript
// ✅ PATTERN: Chart component (category distribution only)
<ExpenseCharts
  categories={categories}
  // Note: Income/Expense BarChart removed - only PieChart for category distribution
/>;

// ✅ PATTERN: InteractionManager untuk defer non-critical work
useFocusEffect(
  React.useCallback(() => {
    let isMounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isMounted) return;
      loadCategories();
    });

    return () => {
      isMounted = false;
      task?.cancel?.();
    };
  }, [loadCategories])
);

// ✅ PATTERN: Count-up animations with custom hook
const useCountUp = (targetValue: number, duration: number) => {
  const [currentValue, setCurrentValue] = useState(0);
  // ... animation logic
  return Math.round(currentValue);
};
```

### 🛠️ Build & Development Commands

```bash
# Development
npm install                      # Install dependencies
npx expo start                   # Start dev server
npx expo start --clear           # Clear cache & start
npm run type-check               # TypeScript validation
npm run lint                     # ESLint check

# Building (IMPORTANT: Expo Go tidak support expo-sqlite)
npm run prebuild                 # Generate native folders
npm run android:build            # Build development APK
npm run android:release          # Build release APK

# Android build requirements
# - JDK configured in android/gradle.properties:
#   org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr
# - SDK path in android/local.properties:
#   sdk.dir=C:/Users/username/AppData/Local/Android/Sdk

# MCP Serena Integration (Code Analysis)
npx mcp-serena analyze              # Deep codebase analysis
npx mcp-serena find-symbol          # Search for functions/classes
npx mcp-serena get-symbols-overview # File structure overview
```

### 🤖 MCP Serena Development Tool

**IMPORTANT**: Project menggunakan **MCP Serena** untuk code analysis dan navigation:

```typescript
// Serena commands yang sering digunakan:
// 1. Cari masalah performa
mcp_oraios_serena_search_for_pattern({
  substring_pattern: "useState.*[\\s\\S]*?}, \\[\\]",
  restrict_search_to_code_files: true,
});

// 2. Analisis symbol relationships
mcp_oraios_serena_find_referencing_symbols({
  symbolName: "addGlobalIncome",
});

// 3. Overview file structure
mcp_oraios_serena_get_symbols_overview({
  relative_path: "src/context/AppContext.tsx",
});
```

**Serena Workflow**:

1. **Activate project**: `mcp_oraios_serena_activate_project`
2. **Read memories**: Context about previous optimizations
3. **Symbol search**: Find functions/classes across codebase
4. **Pattern search**: Regex-based code analysis
5. **Think tools**: Validate task adherence and completion

**Key Serena Patterns**:

- Use `find_symbol` untuk targeted code reads (avoid full file reads)
- Use `search_for_pattern` untuk validation/refactoring patterns
- Use `get_symbols_overview` untuk understanding new files
- Always call `think_about_task_adherence` before major code changes

````

## 🚨 Critical Gotchas & Recent Fixes

### ⚠️ Silent Failure Prevention

```typescript
// ✅ NEW: Validation prevents silent failures
// Before: addGlobalIncome would silently fail if no categories exist
// After: Throws descriptive error that shows in UI Alert

if (categories.length === 0) {
  throw new Error(
    "Tidak ada kategori. Buat kategori terlebih dahulu sebelum menambahkan transaksi."
  );
}
````

### ⚠️ Console Log Performance

```typescript
// ✅ PATTERN: No console.error in production
// Error logs removed from production to improve performance
// Errors still show to user via Alert UI

catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Default message";
  showError(errorMessage); // Only show to user, no console.error
  throw error; // Re-throw for proper error flow
}
```

### ⚠️ Persistent State Management

```typescript
// ✅ PATTERN: AsyncStorage for UI state persistence
// Category selection, settings, etc. survive app restarts
// Always use try/catch with AsyncStorage operations
try {
  await AsyncStorage.setItem("key", JSON.stringify(data));
} catch (error) {
  console.error("Storage error:", error); // OK for dev debugging
}
```

## 📚 Tech Stack & Key Files

**Core**: Expo SDK 54, React 19.1.0, TypeScript 5.9, React Native 0.81.4  
**Navigation**: expo-router 6 (file-based), react-navigation  
**Database**: expo-sqlite 16 (native, requires dev build)  
**Storage**: @react-native-async-storage/async-storage 2.2.0  
**UI**: react-native-paper, @expo/vector-icons  
**Charts**: react-native-chart-kit (lazy loaded, category distribution only)

**Key Files untuk Reference**:

- `src/db/database.ts`: Core business logic, validation, all CRUD operations
- `src/context/AppContext.tsx`: Optimized split state/functions pattern
- `src/hooks/useAllocationValidator.ts`: Example of custom hook pattern (DRY)
- `src/utils/formatCurrency.ts`: Currency formatting without decimals
- `src/components/ExpenseCharts.tsx`: Single PieChart component (BarChart removed)
- `BUILD.md`: Complete build & troubleshooting guide
- `android/gradle.properties`: JDK configuration for builds
- `android/local.properties`: Android SDK path configuration

## 🎯 Project Rules (Non-Negotiable)

1. **100% Offline**: Zero network calls, AsyncStorage for persistence
2. **Android-first**: iOS secondary (iOS untested)
3. **Bahasa Indonesia**: UI text, error messages, business comments
4. **useFocusEffect mandatory**: For ALL screen data loading (not useEffect)
5. **Descriptive error messages**: No silent failures, show specific validation errors
6. **No console.error in production**: Clean logs, errors only to user UI
7. **TouchableOpacity labels**: All radio buttons and checkboxes have clickable labels
8. **Currency without decimals**: formatCurrency returns "Rp150.000" not "Rp150.000,00"
9. **AsyncStorage persistence**: UI state (selections, settings) survives app restarts
10. **Single chart type**: Only category distribution PieChart, no income/expense BarChart
11. **Custom hooks for shared logic**: Extract duplicate validation/logic (DRY principle)
12. **React.memo for heavy components**: FloatingActionButtons, charts, complex lists
13. **InteractionManager**: Defer non-critical work in useFocusEffect
14. **Complete useEffect deps**: All dependencies included, callbacks wrapped with useCallback
15. **Auto-migration**: Schema changes backward compatible, validation added retroactively

## ⚙️ Development Patterns & Conventions

### 🔧 TypeScript & Code Standards

- **Strict mode**: `tsconfig.json` dengan strict checks enabled
- **Interface naming**: PascalCase, export dari `database.ts` (Category, Transaction, Loan)
- **File naming**:
  - Screens: `HomeScreen.tsx` (PascalCase)
  - Components: `CategoryCard.tsx` (PascalCase)
  - Utils: `formatCurrency.ts` (camelCase)
- **Comments**: Business logic dalam Bahasa Indonesia, technical comments dalam English

### 🎨 UI/UX Patterns

```typescript
// ✅ SELALU gunakan colors dari commonStyles.ts
import { colors } from "../styles/commonStyles";

const styles = StyleSheet.create({
  income: { color: colors.income },     // #4CAF50 (green)
  expense: { color: colors.expense },   // #F44336 (red)
  primary: { color: colors.primary },   // #2196F3 (blue)
});

// ✅ Icons: MaterialIcons dengan semantic names
<MaterialIcons name="trending-up" size={24} color={colors.income} />
<MaterialIcons name="trending-down" size={24} color={colors.expense} />

// ✅ Format currency: SELALU gunakan formatCurrency()
import { formatCurrency } from "../utils/formatCurrency";
const formatted = formatCurrency(150000); // "Rp150.000"
```

### 🏗️ Component Patterns

```typescript
// ✅ PATTERN: React.memo untuk heavy components
export const FloatingActionButtons: React.FC = React.memo(() => {
  // Global FAB component with optimization
});

// ✅ PATTERN: InteractionManager untuk defer non-critical work
useFocusEffect(
  React.useCallback(() => {
    let isMounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      if (!isMounted) return;
      loadCategories();
    });

    return () => {
      isMounted = false;
      if (task && typeof task.cancel === "function") {
        task.cancel();
      }
    };
  }, [loadCategories])
);

// ✅ PATTERN: useTransition untuk smooth navigation
const [isNavigating, startTransition] = useTransition();
const navigate = useCallback(
  (target: TargetRoute) => {
    startTransition(() => {
      router.push(target);
    });
  },
  [router]
);
```

### 🎣 Custom Hooks Pattern

```typescript
// ✅ PATTERN: Extract duplicate logic ke reusable hooks
// src/hooks/useAllocationValidator.ts
export const useAllocationValidator = () => {
  const router = useRouter();
  const { categories } = useApp();

  const validateAllocationForNavigation = useCallback((): boolean => {
    // Validation logic shared across 3+ components
  }, [hasCategories, totalAllocationPercentage]);

  return { validateAllocationForNavigation, validateAllocationForTransaction };
};

// Usage di FloatingActionButtons, HomeScreen, AddTransactionScreen
const { validateAllocationForNavigation } = useAllocationValidator();
```

### 🛠️ Build & Development Commands

```bash
# Development
npm install                      # Install dependencies
npx expo start                   # Start dev server
npx expo start --clear           # Clear cache & start
npm run type-check               # TypeScript validation
npm run lint                     # ESLint check

# Building (IMPORTANT: Expo Go tidak support expo-sqlite)
npm run prebuild                 # Generate native folders
npm run android:build            # Build development APK
npm run android:release          # Build release APK

# Troubleshooting
npx expo install --fix           # Fix package versions
npx expo prebuild --clean        # Clean rebuild native code
```

## 🗄️ Database Operations (Critical Patterns)

### Migration & Schema Updates

```typescript
// ✅ PATTERN: Auto-migration dengan backward compatibility
class Database {
  async ensureInitialized() {
    await this.db.execAsync(`CREATE TABLE IF NOT EXISTS categories...`);
    await this.addColumnIfNotExists(
      "transactions",
      "expense_type_id",
      "INTEGER"
    );
  }

  private async tableHasColumn(table: string, column: string) {
    const columns = await this.db.getAllAsync(`PRAGMA table_info(${table})`);
    return columns.some((col) => col.name === column);
  }
}

// ❌ NEVER: Direct schema alteration tanpa migration check
```

### Data Loading Patterns

```typescript
// ✅ ALWAYS: useFocusEffect untuk screen data loading
import { useFocusEffect } from "@react-navigation/native";

useFocusEffect(
  React.useCallback(() => {
    // Data loads setiap kali screen focused
    loadCategories();
    loadTransactions();
  }, [loadCategories, loadTransactions])
);

// ❌ NEVER: useEffect untuk screen data (tidak auto-refresh saat navigate back)
```

## 🚨 Critical Gotchas & Anti-Patterns

### ⚠️ Database & Native Modules

```bash
# ❌ GOTCHA: expo-sqlite TIDAK BERFUNGSI di Expo Go
# Expo Go tidak support custom native modules
# ✅ SOLUTION: Build development client
npm run android:build  # Atau npx expo run:android
```

### ⚠️ State Management Mistakes

```typescript
// ❌ BAD: useEffect untuk screen data
useEffect(() => {
  loadData();
}, []);

// ✅ GOOD: useFocusEffect untuk auto-refresh
useFocusEffect(
  React.useCallback(() => {
    loadData();
  }, [loadData])
);

// ❌ BAD: Context functions tanpa useCallback → infinite loop
const addCategory = async (cat) => {
  /* ... */
};

// ✅ GOOD: Wrap dengan useCallback
const addCategory = useCallback(
  async (cat) => {
    await database.addCategory(cat);
    await loadCategories();
  },
  [loadCategories]
);
```

### ⚠️ Business Logic Validation

```typescript
// ❌ BAD: Expense tanpa validasi saldo
await database.addTransaction({
  type: "expense",
  amount: 1000000,
  category_id: 1,
}); // Bisa negative balance!

// ✅ GOOD: database.ts sudah handle - will throw error if insufficient balance
```

### ⚠️ Performance Pitfalls

```typescript
// ❌ BAD: Load semua data tanpa pagination
const all = await database.getTransactions(); // 10k+ rows!

// ✅ GOOD: Pagination dengan LIMIT/OFFSET
const txs = await database.getTransactions(50, 0);

// ❌ BAD: Duplicate router.prefetch di multiple screens
// HomeScreen.tsx
useEffect(() => {
  router.prefetch("/(tabs)/transaction");
}, [router]);
// FloatingActionButtons.tsx (sudah prefetch sama!)

// ✅ GOOD: Single prefetch source (FAB sudah global)
// HANYA di FloatingActionButtons.tsx (ada di semua screens)
useEffect(() => {
  router.prefetch({ pathname: "/(tabs)/transaction" });
}, [router]);

// ❌ BAD: useEffect missing dependencies → stale closure
useEffect(() => {
  if (action) openModal();
}, [action]); // Missing: openModal, router

// ✅ GOOD: Complete dependencies with useCallback
const openModal = useCallback(() => { ... }, [deps]);
useEffect(() => {
  if (action) openModal();
}, [action, router, openModal]);
```

## 📚 Tech Stack & Key Files

**Core**: Expo SDK 54, React 19, TypeScript 5.9, React Native 0.81  
**Navigation**: expo-router 6 (file-based), react-navigation  
**Database**: expo-sqlite 16 (native, requires dev build)  
**UI**: react-native-paper, @expo/vector-icons  
**Charts**: react-native-chart-kit (lazy loaded)

**Key Files untuk Reference**:

- `src/db/database.ts` (1003 lines): Core business logic, all CRUD operations
- `src/context/AppContext.tsx` (728 lines): Optimized split state/functions pattern
- `src/hooks/useAllocationValidator.ts`: Example of custom hook pattern (DRY)
- `src/utils/allocation.ts`: Business constants (ALLOCATION_TARGET = 100)
- `BUILD.md`: Complete build & troubleshooting guide (requires dev build, not Expo Go)

## 🎯 Project Rules (Non-Negotiable)

1. **100% Offline**: Zero network calls
2. **Android-first**: iOS secondary (iOS untested)
3. **Bahasa Indonesia**: UI text, error messages, business comments
4. **useFocusEffect mandatory**: For ALL screen data loading (not useEffect)
5. **Complete useEffect deps**: Always include all dependencies, wrap callbacks with useCallback
6. **Custom hooks for shared logic**: Extract duplicate validation/logic to hooks (DRY principle)
7. **Single prefetch source**: Only FloatingActionButtons prefetches routes (global component)
8. **React.memo**: For heavy components (FloatingActionButtons, charts)
9. **InteractionManager**: Defer non-critical work in useFocusEffect
10. **Strict validation**: Category % ≤100%, expense ≤ balance
11. **Auto-migration**: Schema changes must be backward compatible
12. **No temp files**: Avoid `test.js`, `debug.js` in git
