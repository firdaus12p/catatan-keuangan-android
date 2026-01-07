# 📚 Troubleshooting Guide - Kemenku Development

## 🚨 Common Issues & Solutions

### 1️⃣ Bundling Error: `SyntaxError: Unexpected token <<<<<<< HEAD`

**Error Message:**

```
Android Bundling failed node_modules\expo-router\entry.js
ERROR  SyntaxError: C:\path\src\screens\HomeScreen.tsx: Unexpected token (12:1)

  10 |   useState,
  11 | } from "react";
> 12 | <<<<<<< HEAD
     |  ^
```

**Cause:** Unresolved Git merge conflict markers committed to repository.

**Quick Fix:**

```bash
# Clear all caches
rm -rf node_modules .expo .next dist
rm -rf android/build
npm install
npx expo start --clear
```

**If that doesn't work:**

1. Find conflict markers: `grep -r "<<<<<<< HEAD" src/`
2. Open conflicted files and manually resolve (see [MERGE_CONFLICT_FIX.md](../MERGE_CONFLICT_FIX.md))
3. Rebuild: `npx expo start --clear`

---

### 2️⃣ Android Build Fails: `Toolchain installation does not provide JAVA_COMPILER`

**Error:**

```
ERROR in ./build.gradle:
"Toolchain installation does not provide the required capabilities: [JAVA_COMPILER]"
```

**Cause:** `JAVA_HOME` or `android/gradle.properties` points to JRE instead of JDK.

**Solution:**

1. **Locate Android Studio's JDK:**

   - Open Android Studio → File → Settings → Build, Execution, Deployment → Build Tools
   - Note the JDK path (usually `C:\Program Files\Android\Android Studio\jbr`)

2. **Update `android/gradle.properties`:**

   ```properties
   # Add/update this line (use your actual path):
   org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr
   ```

3. **Clean and rebuild:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

---

### 3️⃣ Android SDK Path Error: `SDK location not found`

**Error:**

```
ERROR: SDK location not found. Define location with an ANDROID_HOME environment variable or local.properties file
```

**Cause:** `android/local.properties` is missing or misconfigured.

**Solution:**

1. **Find your Android SDK path:**

   - Windows default: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
   - Or check in Android Studio: Settings → SDK Manager → Android SDK Location

2. **Create/Update `android/local.properties`:**

   ```bash
   cd android
   echo sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk > local.properties
   ```

3. **Important:** `local.properties` is in `.gitignore` and should NOT be committed.

---

### 4️⃣ `expo-sqlite` Not Working in Expo Go

**Error:** Database functions silently fail or app crashes when accessing SQLite.

**Cause:** Expo Go doesn't support native modules like `expo-sqlite`. You must use a development build.

**Solution:**

```bash
# Build development client (not Expo Go)
npm run android:build    # Creates APK that supports native modules

# Or use:
npx expo run:android     # Builds and installs automatically
```

**Verification:**

- ❌ DON'T use: `npx expo start` → Scan QR → Expo Go app
- ✅ DO use: Build APK first, then test with built app

---

### 5️⃣ App Crashes with `Cannot Find Module` Errors

**Common Errors:**

- `Cannot find module '@react-native-async-storage/async-storage'`
- `Cannot find module 'expo-notifications'`

**Cause:** Dependencies not installed or build cache is stale.

**Solution:**

```bash
# Complete clean rebuild
rm -rf node_modules package-lock.json .expo
npm install

# Clean build caches
rm -rf android/build android/.gradle android/app/build
rm -rf ~/.gradle    # Global gradle cache (macOS/Linux)

# Rebuild
npx expo prebuild --clean
npx expo run:android
```

---

### 6️⃣ Notifications Don't Work (Status: ✅ FIXED Dec 2025)

**Issue:** Notifications don't trigger at scheduled time.

**Root Cause:** Was using `CALENDAR` trigger instead of `DAILY` trigger.

**Current Fix (Already Applied):**

```typescript
// ✅ CORRECT: Uses DAILY trigger with repeats:true
trigger: {
  type: SchedulableTriggerInputTypes.DAILY,
  hour: hours,
  minute: minutes,
  repeats: true,  // Auto-repeats daily
}
```

**If notifications still don't work:**

1. Ensure using **production build** (not Expo Go)
2. Check notification permissions: `NotificationScreen` → Debug button (DEV only)
3. Verify scheduled notifications are registered
4. See [NOTIFICATION_FIX.md](../NOTIFICATION_FIX.md) for technical details

---

### 7️⃣ TypeScript Compilation Errors

**Error Examples:**

```
Property 'id' does not exist on type 'Category'
Object is possibly 'null' or 'undefined'
```

**Solution:**

```bash
# Run type checker to catch all errors at once
npm run type-check

# Then fix reported errors and restart dev server
npx expo start
```

**Common Patterns:**

- Always check for optional properties: `category?.id`
- Use type guards: `if (id !== undefined) { ... }`
- Add proper return types to functions: `async (x: T): Promise<R> => { ... }`

---

### 8️⃣ Performance Issues: App Slow or Laggy

**Symptoms:**

- Slow scrolling in transaction lists
- Delay when adding categories
- High memory usage

**Debugging:**

```bash
# Check for performance bottlenecks (See PERFORMANCE_OPTIMIZATION_REVIEW.md)
# 1. Use React DevTools Profiler (if available)
# 2. Check for missing dependencies in useEffect/useFocusEffect
# 3. Verify FlatList is properly optimized (see patterns below)
```

**Quick Fixes:**

1. **Ensure FlatList is flattened** (not nested maps):

   ```typescript
   // ❌ BAD: Nested structure
   renderItem={({ item }) => (
     <View>
       {item.transactions.map(tx => <Item />)}
     </View>
   )}

   // ✅ GOOD: Flat array
   const flatData = [...];  // [header, tx1, tx2, header, tx3]
   renderItem={({ item }) => <FlatItem item={item} />}
   ```

2. **Memoize render functions:**

   ```typescript
   const renderItem = useCallback(({ item }) => <Item {...item} />, []);
   const renderHeader = useCallback(() => <Header />, []);
   ```

3. **Check dependencies in effects:**

   ```typescript
   // ❌ BAD: Missing or incorrect deps
   useEffect(() => loadData(), []);

   // ✅ GOOD: All deps included
   useFocusEffect(
     useCallback(() => {
       loadData();
     }, [loadData])
   );
   ```

---

### 9️⃣ State Not Persisting Across App Restarts

**Issue:** User selections, category choices disappear when app closes.

**Cause:** AsyncStorage not properly saving/loading data.

**Solution:**

Verify AsyncStorage setup in your screen/component:

```typescript
// ✅ PATTERN: Load on mount
useEffect(() => {
  const load = async () => {
    try {
      const saved = await AsyncStorage.getItem("@key");
      if (saved) setData(JSON.parse(saved));
    } catch (error) {
      // Silent error handling
    }
  };
  load();
}, []);

// ✅ PATTERN: Save on change
const handleChange = useCallback(async (value) => {
  setState(value);
  try {
    await AsyncStorage.setItem("@key", JSON.stringify(value));
  } catch (error) {
    // Silent error - non-critical
  }
}, []);
```

---

### 🔟 Linting Errors

**Error:** ESLint fails before running app.

**Solution:**

```bash
# Check all linting issues
npm run lint

# Automatically fix auto-fixable issues
npx eslint src/ --fix

# Or manually fix reported issues and restart
npx expo start
```

---

## 🔍 Debugging Tools & Commands

### Check Current Git Status

```bash
git status              # See uncommitted changes
git log --oneline -10   # See recent commits
git branch -a           # See all branches
```

### Clean Full Environment

```bash
# Nuclear option - start from scratch
rm -rf node_modules .expo android/build android/.gradle
rm -rf ~/.gradle        # Global gradle cache
npm install
npx expo prebuild --clean
npx expo run:android
```

### View Console Logs

```bash
# iOS
xcrun simctl launch booted log stream --predicate "process == 'catatan-keuangan'"

# Android
adb logcat | grep catatan-keuangan
```

### Run Type Checking

```bash
npm run type-check
```

### Inspect Database (SQLite)

```bash
# On device/emulator
adb shell
cd /data/data/com.yourcompany.catatankeuangan/files
sqlite3 database.db
# Then use SQL commands...
```

---

## 📋 Checklist: Before Opening an Issue

- [ ] Run `npm install` (dependencies installed)
- [ ] Run `npx expo start --clear` (cache cleared)
- [ ] Using Android build, NOT Expo Go (if using `expo-sqlite`)
- [ ] Checked TypeScript errors: `npm run type-check`
- [ ] Checked ESLint errors: `npm run lint`
- [ ] No merge conflict markers in source files
- [ ] Android SDK and JDK properly configured
- [ ] `android/local.properties` exists (not committed)
- [ ] All relevant files have been edited consistently

---

## 🆘 Still Having Issues?

1. **Check the main docs**: [README.md](../README.md), [BUILD.md](../BUILD.md)
2. **Check specific fixes**: [NOTIFICATION_FIX.md](../NOTIFICATION_FIX.md), [MERGE_CONFLICT_FIX.md](../MERGE_CONFLICT_FIX.md)
3. **Review performance tips**: [PERFORMANCE_OPTIMIZATION_REVIEW.md](../PERFORMANCE_OPTIMIZATION_REVIEW.md)
4. **Check copilot instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
5. **Search git history**: `git log --all --grep="keyword"`
6. **Check Android build output**: `cd android && ./gradlew assembleRelease --info`

---

**Last Updated:** January 7, 2026  
**Status:** ✅ All common issues documented with solutions
