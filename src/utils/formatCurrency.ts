// Format angka menjadi format mata uang Rupiah
export const formatCurrency = (amount: number): string => {
  const hasFraction = Math.abs(amount % 1) > Number.EPSILON;
  const formatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  });

  const formatted = formatter.format(Math.abs(amount));
  return amount < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
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
