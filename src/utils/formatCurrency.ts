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

// Parse string currency menjadi number
export const parseCurrency = (currencyString: string): number => {
  // Hilangkan semua karakter non-digit kecuali koma dan titik
  const cleanString = currencyString.replace(/[^\d.,]/g, "");

  // Ganti koma dengan titik jika ada
  const normalizedString = cleanString.replace(",", ".");

  return parseFloat(normalizedString) || 0;
};
