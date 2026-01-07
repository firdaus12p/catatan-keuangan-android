# 🔧 Fix Merge Conflict Error

## ⚠️ Problem

When cloning the repository and running `npx expo start`, you get this error:

```
Android Bundling failed 5477ms node_modules\expo-router\entry.js (1686 modules)
ERROR  SyntaxError: C:\path\catatan-keuangan\src\screens\HomeScreen.tsx: Unexpected token (12:1)

  10 |   useState,
  11 | } from "react";
> 12 | <<<<<<< HEAD
     |  ^
  13 | import {
```

## 🎯 Root Cause

There are **unresolved Git merge conflict markers** committed into the repository. These conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) are not valid TypeScript/JavaScript syntax, causing the bundler to fail.

## ✅ Solution

### Option 1: Clean Repository (Recommended)

Identify and remove all unresolved merge conflict markers from the committed files:

```bash
# Search for conflict markers in all source files
grep -r "<<<<<<< HEAD" src/ app/
grep -r "=======" src/ app/
grep -r ">>>>>>>" src/ app/

# The output will show which files have conflict markers
# Edit those files and resolve the conflicts manually
```

### Option 2: Force Reset to Clean State

If you have access to edit the repository, reset to the last known good commit:

```bash
# Find the last good commit before conflicts were introduced
git log --oneline

# Reset to that commit (replace COMMIT_HASH with actual hash)
git reset --hard COMMIT_HASH
git push origin branch-name --force

# Alternative: If you're on develop/main, sync from a backup
git fetch origin
git reset --hard origin/develop  # Use your actual branch name
```

### Option 3: Manual Fix (For End Users)

If you've already cloned and want to work with the repo as-is:

1. **Open affected files** (e.g., `src/screens/HomeScreen.tsx`)
2. **Search for conflict markers**:
   - `<<<<<<< HEAD` - marks the beginning of your version
   - `=======` - marks the separator
   - `>>>>>>> branch-name` - marks the end of incoming version
3. **Manually resolve**: Choose which version to keep or merge them
4. **Remove conflict markers** entirely
5. **Rebuild**: Clear cache and restart dev server

```bash
# Clear all caches
rm -rf node_modules .expo .next dist
rm -rf android/build  # Android build cache
npm install
npx expo start --clear
```

## 📋 Steps to Fix This Permanently

### For Repository Maintainer:

1. **Find all files with conflict markers**:

   ```bash
   find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" | \
   xargs grep -l "<<<<<<< HEAD"
   ```

2. **For each file**, manually resolve conflicts:

   - Keep the version you want
   - Remove conflict markers
   - Test the file

3. **Commit the fix**:

   ```bash
   git add src/screens/HomeScreen.tsx  # affected files
   git commit -m "fix: resolve merge conflicts"
   git push
   ```

4. **Verify in clean clone**:
   ```bash
   cd /tmp
   rm -rf catatan-keuangan-test
   git clone https://github.com/yourrepo/catatan-keuangan.git catatan-keuangan-test
   cd catatan-keuangan-test
   npm install
   npx expo start
   # Should work without bundling errors
   ```

## 🚨 Prevention

Add `.gitattributes` to prevent conflict markers from being committed:

```bash
# Create .gitattributes in repo root
cat > .gitattributes << 'EOF'
* text=auto
*.tsx merge=union
*.ts merge=union
*.js merge=union
*.json merge=union
EOF

git add .gitattributes
git commit -m "chore: add gitattributes to prevent conflict markers"
```

Or add a pre-commit hook:

```bash
# .git/hooks/pre-commit
#!/bin/bash
if grep -r "<<<<<<< HEAD" . --include="*.ts" --include="*.tsx" --include="*.js"; then
  echo "❌ ERROR: Unresolved merge conflicts found!"
  echo "Please resolve conflicts before committing"
  exit 1
fi
```

## ✨ Quick Recovery Commands

```bash
# One-liner to remove all conflict markers (backup first!)
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" | \
xargs sed -i '/^<<<<<<< HEAD$/,/^>>>>>>> .*$/{ /^<<<<<<< HEAD$/d; /^=======$/d; /^>>>>>>> .*$/d; }'

# Or manually for specific file
# 1. Open src/screens/HomeScreen.tsx
# 2. Find and delete lines between/including <<<<<<< HEAD and >>>>>>>
# 3. Save
# 4. npm install && npx expo start
```

---

**Need help?** Check your git status or run:

```bash
git status  # See if there are merge conflicts
git log --all --oneline  # See all commits
git branch -a  # See all branches
```
