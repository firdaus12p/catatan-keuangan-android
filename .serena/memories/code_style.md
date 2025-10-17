# Code Style & Conventions

## File Naming
- **Screens**: PascalCase → `CategoryScreen.tsx`, `HomeScreen.tsx`
- **Components**: PascalCase → `CategoryCard.tsx`, `TransactionItem.tsx`
- **Utils**: camelCase → `formatCurrency.ts`, `dateHelper.ts`
- **Context**: PascalCase → `AppContext.tsx`
- **Styles**: camelCase → `commonStyles.ts`

## Directory Structure
```
src/
├── components/     # Reusable UI components
├── context/        # State management (Context API)
├── db/             # SQLite database operations
├── screens/        # Main application screens
├── styles/         # Shared styles and colors
└── utils/          # Helper functions
```

## TypeScript Standards
- **Strict mode**: Enabled
- **Interfaces**: Define for all data types (Category, Transaction, Loan)
- **Type annotations**: Required for function parameters and returns
- **No any**: Avoid `any` type, use proper typing

## React Patterns
- **Hooks**: Use `useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`
- **useFocusEffect**: For screen data refresh (not `useEffect`)
- **Component Structure**: Functional components only
- **Props destructuring**: Use destructuring for cleaner code

## Database Patterns
- **Async/await**: All database operations
- **Try/catch**: Error handling mandatory
- **Transactions**: Use BEGIN/COMMIT/ROLLBACK for batch operations
- **Indexing**: Index frequently queried columns (category_id, date)
- **Pagination**: LIMIT/OFFSET for large data lists

## Naming Conventions
- **Functions**: camelCase → `loadCategories()`, `addTransaction()`
- **Constants**: UPPER_SNAKE_CASE → `DEFAULT_CATEGORY`
- **Boolean**: Prefix with `is`, `has`, `should` → `isLoading`, `hasError`
- **Event handlers**: Prefix with `handle` → `handleSubmit`, `handleDelete`

## Comments
- **Business logic**: Indonesian
- **Technical comments**: English
- **No temporary**: Remove debug comments before commit
- **JSDoc**: For complex functions