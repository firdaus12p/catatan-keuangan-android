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

// Format angka untuk input dengan preservasi cursor position
export const formatNumberInputWithCursor = (
  value: string,
  selectionStart: number
): { formattedValue: string; cursorPosition: number } => {
  // Hapus semua karakter non-digit
  const numbers = value.replace(/[^\d]/g, "");

  // Jika kosong, return kosong
  if (!numbers) {
    return { formattedValue: "", cursorPosition: 0 };
  }

  // Hitung berapa digit yang ada sebelum cursor position
  const beforeCursor = value.substring(0, selectionStart);
  const digitsBeforeCursor = beforeCursor.replace(/[^\d]/g, "").length;

  // Format dengan titik sebagai pemisah ribuan
  const formattedValue = parseInt(numbers).toLocaleString("id-ID");

  // Hitung posisi cursor baru berdasarkan jumlah digit yang sudah dihitung
  let newCursorPosition = 0;
  let digitCount = 0;

  for (let i = 0; i < formattedValue.length; i++) {
    if (/\d/.test(formattedValue[i])) {
      digitCount++;
      if (digitCount === digitsBeforeCursor) {
        newCursorPosition = i + 1;
        break;
      }
    }
  }

  // Jika cursor berada di akhir, posisikan di akhir formatted value
  if (digitCount < digitsBeforeCursor || selectionStart >= value.length) {
    newCursorPosition = formattedValue.length;
  }

  return { formattedValue, cursorPosition: newCursorPosition };
};

// Parse string input kembali ke number
export const parseNumberInput = (value: string): number => {
  // Hapus semua karakter non-digit
  const numbers = value.replace(/[^\d]/g, "");
  return parseInt(numbers) || 0;
};
