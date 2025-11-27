import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useApp } from "../context/AppContext";
import { showConfirm, showWarning } from "../utils/alertHelper";
import {
  getAllocationDeficit,
  isAllocationComplete,
} from "../utils/allocation";

/**
 * Custom hook untuk validasi alokasi kategori sebelum transaksi
 * Digunakan di FloatingActionButtons, HomeScreen, dan AddTransactionScreen
 */
export const useAllocationValidator = () => {
  const router = useRouter();
  const { categories } = useApp();

  const hasCategories = categories.length > 0;

  const totalAllocationPercentage = categories.reduce(
    (sum, cat) => sum + cat.percentage,
    0
  );

  /**
   * Validasi untuk FloatingActionButtons dan HomeScreen
   * Menggunakan showWarning dengan pesan singkat
   */
  const validateAllocationForNavigation = useCallback((): boolean => {
    if (!hasCategories) {
      return true;
    }

    if (!isAllocationComplete(totalAllocationPercentage)) {
      const deficit = getAllocationDeficit(totalAllocationPercentage);
      showWarning(
        `Total alokasi kategori saat ini ${totalAllocationPercentage.toFixed(
          1
        )}%.\n\nTambahkan alokasi sebesar ${deficit.toFixed(
          1
        )}% lagi agar mencapai 100% sebelum mencatat transaksi.\n\nSilakan menuju halaman Kategori untuk menambah kategori atau mengatur ulang persentase.`,
        "Alokasi Belum Lengkap"
      );
      return false;
    }
    return true;
  }, [hasCategories, totalAllocationPercentage]);

  /**
   * Validasi untuk AddTransactionScreen
   * Menggunakan showConfirm dengan navigasi ke halaman kategori
   */
  const validateAllocationForTransaction = useCallback((): boolean => {
    if (!hasCategories) {
      return true;
    }

    if (!isAllocationComplete(totalAllocationPercentage)) {
      const deficit = getAllocationDeficit(totalAllocationPercentage);
      showConfirm(
        "Alokasi Belum Lengkap",
        `Total alokasi kategori saat ini ${totalAllocationPercentage.toFixed(
          1
        )}%.\n\nTambahkan alokasi sebesar ${deficit.toFixed(
          1
        )}% lagi agar mencapai 100% sebelum dapat menginput transaksi.\n\nSilakan pergi ke halaman Kategori untuk menambah kategori atau mengatur ulang persentase alokasi.`,
        () => router.push("/(tabs)/category"),
        undefined,
        "Ke Halaman Kategori",
        "OK"
      );
      return false;
    }
    return true;
  }, [hasCategories, router, totalAllocationPercentage]);

  return {
    hasCategories,
    totalAllocationPercentage,
    validateAllocationForNavigation,
    validateAllocationForTransaction,
  };
};
