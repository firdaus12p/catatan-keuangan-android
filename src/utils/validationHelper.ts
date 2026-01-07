import { showError } from "./alertHelper";
import { formatCurrency } from "./formatCurrency";

/**
 * Utility functions untuk validasi input yang umum digunakan
 */

export const validatePositiveAmount = (
  amount: number | string,
  fieldName: string = "Jumlah"
): boolean => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    showError(`${fieldName} harus lebih dari 0`);
    return false;
  }
  return true;
};

export const validateNonEmptyString = (
  value: string,
  fieldName: string
): boolean => {
  if (!value || value.trim().length === 0) {
    showError(`${fieldName} tidak boleh kosong`);
    return false;
  }
  return true;
};

export const validatePercentage = (
  percentage: number,
  min: number = 1,
  max: number = 100
): boolean => {
  if (percentage < min || percentage > max) {
    showError(`Persentase harus antara ${min}-${max}`);
    return false;
  }
  return true;
};

export const validateSelection = (value: any, fieldName: string): boolean => {
  if (!value || value === null || value === undefined) {
    showError(`Pilih ${fieldName} terlebih dahulu`);
    return false;
  }
  return true;
};

export const validateSufficientBalance = (
  balance: number,
  required: number,
  itemName: string = "kategori"
): boolean => {
  if (balance < required) {
    showError(
      `Saldo ${itemName} tidak mencukupi. Tersedia: ${formatCurrency(
        balance
      )}, Diperlukan: ${formatCurrency(required)}`
    );
    return false;
  }
  return true;
};
