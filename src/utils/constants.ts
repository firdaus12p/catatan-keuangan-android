/**
 * Application Constants
 * Centralized constant values untuk menghindari magic numbers
 */

// ==================== TIMING CONSTANTS ====================
export const TIMING = {
  // Animation durations (milliseconds)
  ANIMATION_SHORT: 300,
  ANIMATION_MEDIUM: 1000,
  ANIMATION_LONG: 1500,

  // Count-up animation durations
  COUNTUP_DEFAULT: 1000,
  COUNTUP_BALANCE: 1200,
  COUNTUP_TOTAL: 1300,
  COUNTUP_NET: 1500,

  // Notification & Scheduler
  NOTIFICATION_RESCHEDULE_DELAY: 1000,
  TEST_NOTIFICATION_DELAY: 3000,

  // UI Transitions
  MODAL_TRANSITION_DELAY: 300,

  // Splash Screen
  SPLASH_DELAY: 1500,
} as const;

// ==================== FLATLIST PERFORMANCE ====================
export const FLATLIST_CONFIG = {
  // Standard config untuk list dengan banyak item
  DEFAULT: {
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 5,
    INITIAL_NUM_TO_RENDER: 10,
    UPDATE_CELLS_BATCHING_PERIOD: 50,
  },

  // Config untuk list kategori (item lebih sedikit)
  CATEGORY: {
    MAX_TO_RENDER_PER_BATCH: 8,
    WINDOW_SIZE: 5,
    INITIAL_NUM_TO_RENDER: 8,
    UPDATE_CELLS_BATCHING_PERIOD: 50,
  },
} as const;

// ==================== TYPOGRAPHY ====================
export const FONT_WEIGHTS = {
  NORMAL: "400",
  MEDIUM: "500",
  SEMIBOLD: "600",
  BOLD: "700",
} as const;

// ==================== BALANCE THRESHOLDS ====================
export const BALANCE_THRESHOLDS = {
  HIGH: 100000, // Saldo tinggi (warna hijau)
  MEDIUM: 50000, // Saldo sedang (warna orange)
  // LOW: 0+ (warna kuning)
  // EMPTY: 0 or negative (warna merah)
} as const;

// ==================== CHART DIMENSIONS ====================
export const CHART = {
  DEFAULT_HEIGHT: 200,
  MODAL_MAX_HEIGHT: 300,
} as const;

// ==================== LAYOUT DIMENSIONS ====================
export const LAYOUT = {
  BOTTOM_PADDING: 100, // Extra padding untuk floating buttons
  TRANSACTION_PADDING_RIGHT: 238, // Padding kanan untuk transaction screen
} as const;

// ==================== ALLOCATION CONSTANTS ====================
export const ALLOCATION = {
  TARGET_PERCENTAGE: 100, // Total target alokasi kategori
  MIN_PERCENTAGE: 1,
  MAX_PERCENTAGE: 100,
} as const;

// ==================== TIME CONVERSION ====================
export const TIME = {
  SECONDS_IN_MILLISECOND: 1000,
} as const;

// ==================== CHART COLOR CONSTANTS ====================
export const CHART_COLORS = {
  HSL_HUE_STEP: 60, // Step untuk HSL color generation
  HSL_SATURATION: 50,
  HSL_LIGHTNESS: 50,
  HSL_MAX_HUE: 360,
} as const;
