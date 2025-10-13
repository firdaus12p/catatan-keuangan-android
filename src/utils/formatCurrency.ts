// Format angka menjadi format mata uang Rupiah
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format angka tanpa simbol mata uang
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("id-ID").format(amount);
};

// Format angka untuk input dengan titik sebagai pemisah ribuan
export const formatNumberInput = (value: string): string => {
  // Hapus semua karakter non-digit
  const numbers = value.replace(/[^\d]/g, "");

  // Jika kosong, return kosong
  if (!numbers) return "";

  // Format dengan titik sebagai pemisah ribuan
  return parseInt(numbers).toLocaleString("id-ID");
};

// Parse string input kembali ke number
export const parseNumberInput = (value: string): number => {
  // Hapus semua karakter non-digit
  const numbers = value.replace(/[^\d]/g, "");
  return parseInt(numbers) || 0;
};

// Parse string currency menjadi number
export const parseCurrency = (currencyString: string): number => {
  // Hilangkan semua karakter non-digit kecuali koma dan titik
  const cleanString = currencyString.replace(/[^\d.,]/g, "");

  // Ganti koma dengan titik jika ada
  const normalizedString = cleanString.replace(",", ".");

  return parseFloat(normalizedString) || 0;
};
