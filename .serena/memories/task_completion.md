# Task Completion Checklist

## After Completing Any Task

### 1. Code Quality Check
- [ ] No duplicate code or files
- [ ] No temporary files (test.js, debug.js, fix_v2.js)
- [ ] All imports properly organized
- [ ] No unused variables or imports
- [ ] TypeScript types properly defined
- [ ] Comments in Indonesian for business logic
- [ ] Remove all console.log() debug statements

### 2. Performance Validation
- [ ] Check React DevTools for unnecessary re-renders
- [ ] Verify database queries use proper indexing
- [ ] Confirm pagination is working for large lists
- [ ] Test scroll performance with large datasets
- [ ] Monitor memory usage in long sessions

### 3. Functional Testing
- [ ] Run `npx expo start` without errors
- [ ] Test on Android emulator or device
- [ ] Verify all CRUD operations work correctly
- [ ] Test navigation between all screens
- [ ] Confirm data persistence after app restart
- [ ] Test edge cases (empty states, max limits)

### 4. Code Standards
- [ ] Run `npm run lint` and fix all issues
- [ ] Verify all functions use async/await properly
- [ ] Confirm error handling with try/catch
- [ ] Check that useFocusEffect is used for screen refresh
- [ ] Validate useCallback/useMemo usage

### 5. Documentation
- [ ] Update tasklist.md with ✔️ for completed items
- [ ] Add comments for complex logic
- [ ] Update README if new features added
- [ ] Document any breaking changes

### 6. Git Workflow
```bash
git status                    # Check changes
git add .                     # Stage all changes
git commit -m "feat: ..."     # Descriptive commit
git push origin branch-name   # Push to remote
```

## Commit Message Format
- `feat:` - New feature
- `fix:` - Bug fix
- `perf:` - Performance improvement
- `refactor:` - Code refactoring
- `style:` - UI/styling changes
- `docs:` - Documentation
- `test:` - Testing

## Final Validation Commands
```bash
npx expo start --clear    # Clear cache and start
npm run lint              # Check linting
```