// Format angka menjadi format mata uang Rupiah (tanpa desimal, gaya santai)
export const formatCurrency = (amount: number): string => {
  const formatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatted = formatter.format(Math.abs(amount));
  return amount < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
};

// Format angka tanpa simbol mata uang (tanpa desimal)
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

// Format angka untuk input dengan titik sebagai pemisah ribuan (tanpa desimal)
export const formatNumberInput = (value: string): string => {
  // Hapus semua karakter non-digit
  const numbers = value.replace(/[^\d]/g, "");

  // Jika kosong, return kosong
  if (!numbers) return "";

  // Format dengan titik sebagai pemisah ribuan (explicit 0 decimals)
  return parseInt(numbers).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Parse string input kembali ke number
export const parseNumberInput = (value: string): number => {
  // Hapus semua karakter non-digit
  const numbers = value.replace(/[^\d]/g, "");
  return parseInt(numbers) || 0;
};
