# Project Overview: Catatan Keuangan (CatatKu)

## Purpose
Aplikasi pencatat keuangan pribadi **offline-first** untuk Android yang dibangun dengan React Native Expo dan SQLite. Fokus pada:
- Distribusi pendapatan otomatis berbasis kategori
- Pencatatan transaksi (pemasukan/pengeluaran)
- Manajemen pinjaman
- Statistik keuangan dengan visualisasi chart

## Tech Stack
- **Framework**: React Native Expo ~54.0
- **Language**: TypeScript ~5.9.2
- **Database**: SQLite (expo-sqlite ^16.0.8)
- **Navigation**: Expo Router v6 (file-based routing)
- **UI Library**: react-native-paper ^5.14.5
- **Charts**: react-native-chart-kit ^6.12.0
- **State Management**: Context API
- **Icons**: @expo/vector-icons

## Key Features
1. **Kategori**: Kelola kategori dengan persentase alokasi (total ≤100%)
2. **Transaksi**: Input pemasukan (global/kategori) dan pengeluaran
3. **Pinjaman**: Track status (unpaid/half/paid) dengan kategori terkait
4. **Statistik**: Dashboard dengan charts dan summary keuangan
5. **Offline-first**: 100% lokal, no API dependencies

## Project Principles
- **Clean Code**: No duplicate files, descriptive naming, PascalCase for components
- **Performance**: Pagination, indexing, lazy loading for large datasets
- **Stability**: Support Android 8+, RAM 3GB optimization
- **User-friendly**: Simple, responsive UI dengan Material Design