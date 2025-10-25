# Development Commands

## Installation
```bash
npm install
```

## Running the App
```bash
# Start development server
npx expo start

# Start with cache clear
npx expo start --clear

# Run on Android
npx expo start --android

# Run on specific platforms
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## Development Tools
```bash
# Linting
npm run lint

# Reset project (move starter to app-example)
npm run reset-project
```

## Testing on Device
- Use **Expo Go** app on Android device
- Scan QR code from terminal
- Or use Android Studio emulator

## Windows-specific Commands
```powershell
# List files
ls
dir

# Find files
Get-ChildItem -Recurse -Filter "*.tsx"

# Search in files
Select-String -Path "*.tsx" -Pattern "useEffect"

# Clear terminal
clear
cls
```

## Git Workflow
```bash
git status
git add .
git commit -m "feat: description"
git push origin branch-name
```

## Performance Checks
- Monitor console for warnings/errors
- Check React DevTools for re-renders
- Use Expo performance monitor (shake device)