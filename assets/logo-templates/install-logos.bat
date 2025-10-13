@echo off
echo.
echo =========================================
echo   LOGO INSTALLER untuk CatatKu App
echo =========================================
echo.

echo Mengcopy logo files ke direktori assets...

if exist "icon.png" (
    copy "icon.png" "..\images\icon.png"
    echo ✓ icon.png berhasil di-copy
) else (
    echo ✗ icon.png tidak ditemukan
)

if exist "android-icon-foreground.png" (
    copy "android-icon-foreground.png" "..\images\android-icon-foreground.png"
    echo ✓ android-icon-foreground.png berhasil di-copy
) else (
    echo ✗ android-icon-foreground.png tidak ditemukan
)

if exist "android-icon-background.png" (
    copy "android-icon-background.png" "..\images\android-icon-background.png"
    echo ✓ android-icon-background.png berhasil di-copy
) else (
    echo ✗ android-icon-background.png tidak ditemukan
)

if exist "android-icon-monochrome.png" (
    copy "android-icon-monochrome.png" "..\images\android-icon-monochrome.png"
    echo ✓ android-icon-monochrome.png berhasil di-copy
) else (
    echo ✗ android-icon-monochrome.png tidak ditemukan
)

if exist "splash-icon.png" (
    copy "splash-icon.png" "..\images\splash-icon.png"
    echo ✓ splash-icon.png berhasil di-copy
) else (
    echo ✗ splash-icon.png tidak ditemukan
)

if exist "favicon.png" (
    copy "favicon.png" "..\images\favicon.png"
    echo ✓ favicon.png berhasil di-copy
) else (
    echo ✗ favicon.png tidak ditemukan
)

echo.
echo =========================================
echo   Instalasi logo selesai!
echo =========================================
echo.
echo Jalankan command berikut untuk refresh:
echo npx expo start --clear
echo.
pause