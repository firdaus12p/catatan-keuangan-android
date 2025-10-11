// Helper functions untuk tanggal
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format tanggal untuk input
export const formatDateInput = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
};

// Mendapatkan tanggal hari ini dalam format string
export const getTodayString = (): string => {
  return new Date().toISOString();
};

// Mendapatkan rentang tanggal untuk bulan tertentu
export const getMonthRange = (
  year: number,
  month: number
): { start: string; end: string } => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Hari terakhir bulan

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

// Mendapatkan bulan dan tahun saat ini
export const getCurrentMonthYear = (): { month: number; year: number } => {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // JavaScript month dimulai dari 0
    year: now.getFullYear(),
  };
};

// Mendapatkan nama bulan dalam bahasa Indonesia
export const getMonthName = (month: number): string => {
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return monthNames[month - 1] || "";
};

// Cek apakah tanggal dalam bulan ini
export const isCurrentMonth = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  return (
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth()
  );
};
