import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { Platform } from "react-native";

// Conditional import untuk expo-notifications
let Notifications: any = null;

// Check apakah environment mendukung notifications
const isNotificationSupported = () => {
  try {
    // Cek jika bukan Expo Go dan bukan web
    const isWeb = Platform.OS === "web";

    // Untuk development, cek apakah di Expo Go dengan cara yang lebih reliable
    const isExpoGo =
      __DEV__ &&
      typeof global !== "undefined" &&
      global.expo &&
      global.expo.modules &&
      global.expo.modules.ExpoGo;

    return !isExpoGo && !isWeb;
  } catch {
    return true; // Default true untuk native builds
  }
};

// Lazy import notifications
const getNotifications = async () => {
  if (!Notifications && isNotificationSupported()) {
    try {
      Notifications = await import("expo-notifications");

      // Setup handler jika berhasil import
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // ✅ ANDROID ONLY: Setup notification channel untuk daily reminder
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("daily-reminder", {
          name: "Pengingat Harian",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#2196F3",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
        });
      }
    } catch (error) {
      console.warn("expo-notifications not available in this environment");
      return null;
    }
  }
  return Notifications;
};

// Interface untuk pengaturan notifikasi
export interface NotificationSettings {
  isEnabled: boolean;
  time: string; // Format HH:mm (24 hour)
  timezone: string;
}

// Key untuk AsyncStorage
const NOTIFICATION_SETTINGS_KEY = "notification_settings";
const NOTIFICATION_ID_KEY = "scheduled_notification_id";

// Store listener subscription untuk cleanup
let notificationListenerSubscription: any = null;

/**
 * Request permission untuk notifikasi
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const notificationModule = await getNotifications();
    if (!notificationModule) {
      console.warn("Notifications not supported in this environment");
      return false;
    }

    const { status: existingStatus } =
      await notificationModule.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await notificationModule.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.error("Error requesting notification permissions:", error);

    // Jika error terkait Expo Go, berikan pesan yang lebih informatif
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("expo-notifications")) {
      console.warn(
        "Running in Expo Go - some notification features may be limited"
      );
      return false;
    }

    return false;
  }
};

/**
 * Simpan pengaturan notifikasi ke AsyncStorage
 */
export const saveNotificationSettings = async (
  settings: NotificationSettings
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error("Error saving notification settings:", error);
    throw error;
  }
};

/**
 * Load pengaturan notifikasi dari AsyncStorage
 */
export const loadNotificationSettings =
  async (): Promise<NotificationSettings | null> => {
    try {
      const settingsJson = await AsyncStorage.getItem(
        NOTIFICATION_SETTINGS_KEY
      );
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return null;
    } catch (error) {
      console.error("Error loading notification settings:", error);
      return null;
    }
  };

/**
 * Dapatkan timezone perangkat user
 */
export const getDeviceTimezone = (): string => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      // Gunakan timezone dari locale pertama
      return locales[0].regionCode || "ID";
    }
    return "ID"; // Default Indonesia
  } catch (error) {
    console.error("Error getting device timezone:", error);
    return "ID";
  }
};

/**
 * Konversi waktu ke Date object dengan timezone yang benar
 */
const createNotificationDate = (timeString: string): Date => {
  const now = new Date();
  const [hours, minutes] = timeString.split(":").map(Number);

  // Buat date untuk notifikasi hari ini
  const notificationDate = new Date(now);
  notificationDate.setHours(hours, minutes, 0, 0);

  // Jika waktu sudah terlewat hari ini, jadwalkan untuk besok
  if (notificationDate <= now) {
    notificationDate.setDate(notificationDate.getDate() + 1);
  }

  return notificationDate;
};

/**
 * Jadwalkan notifikasi harian
 * ✅ FIXED: Gunakan DAILY trigger untuk Android yang reliable
 */
export const scheduleNotification = async (
  settings: NotificationSettings
): Promise<string | null> => {
  try {
    // Check notification support first
    const notificationModule = await getNotifications();
    if (!notificationModule) {
      throw new Error("Notifikasi tidak didukung di environment ini (Expo Go)");
    }

    // Batalkan notifikasi yang sudah ada
    await cancelScheduledNotification();

    if (!settings.isEnabled) {
      return null;
    }

    // Check permission terlebih dahulu
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      throw new Error("Permission denied for notifications");
    }

    const [hours, minutes] = settings.time.split(":").map(Number);

    let notificationId: string;

    // ✅ FIXED: Gunakan DAILY trigger untuk Android (lebih reliable dari TIME_INTERVAL)
    // DAILY trigger otomatis repeat setiap hari tanpa perlu reschedule manual
    if (Platform.OS === "android") {
      // Android menggunakan DAILY trigger dengan repeats: true
      notificationId = await notificationModule.scheduleNotificationAsync({
        content: {
          title: "⏰ Kemenku - Catat Keuangan",
          body: "Waktunya mencatat pengeluaran hari ini! 💰",
          sound: true,
          priority: notificationModule.AndroidNotificationPriority.HIGH,
          // Android notification channel config
          channelId: "daily-reminder",
        },
        trigger: {
          type: notificationModule.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
          repeats: true, // ✅ CRITICAL FIX: repeats HARUS true untuk daily
        },
      });
    } else {
      // iOS bisa menggunakan calendar trigger
      notificationId = await notificationModule.scheduleNotificationAsync({
        content: {
          title: "⏰ Kemenku - Catat Keuangan",
          body: "Waktunya mencatat pengeluaran hari ini! 💰",
          sound: true,
        },
        trigger: {
          type: notificationModule.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
    }

    // Simpan ID notifikasi untuk referensi
    await AsyncStorage.setItem(NOTIFICATION_ID_KEY, notificationId);

    // ✅ LOGGING: Debug info untuk verifikasi notifikasi terjadwal
    console.log(
      `[NOTIFICATION] Scheduled daily reminder at ${hours}:${minutes}`
    );
    console.log(`[NOTIFICATION] Notification ID: ${notificationId}`);
    console.log(
      `[NOTIFICATION] Platform: ${Platform.OS}, Trigger: DAILY, Repeats: true`
    );

    // ✅ REMOVED: Tidak perlu listener lagi karena trigger DAILY sudah auto-repeat
    // setupNotificationListener() dihapus karena tidak reliable untuk background

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific Android/Expo Go errors
    if (errorMessage.includes("calendar is not supported")) {
      throw new Error(
        "Notifikasi tidak didukung di perangkat ini. Coba gunakan development build."
      );
    } else if (errorMessage.includes("expo-notifications")) {
      throw new Error(
        "Fitur notifikasi terbatas di Expo Go. Gunakan development build untuk fitur lengkap."
      );
    }

    throw error;
  }
};

/**
 * Setup listener untuk reschedule notifikasi Android
 * ⚠️ DEPRECATED: Tidak diperlukan lagi karena DAILY trigger otomatis repeat
 * Listener ini hanya bekerja saat app foreground, tidak reliable untuk background
 *
 * REMOVED karena:
 * 1. DAILY trigger sudah auto-repeat tanpa perlu reschedule manual
 * 2. addNotificationReceivedListener hanya bekerja saat app foreground
 * 3. Tidak reliable untuk notifikasi daily yang persistent
 */
const setupNotificationListener = async (settings: NotificationSettings) => {
  // ✅ DEPRECATED: Function ini tidak dipakai lagi
  // Dibiarkan untuk backward compatibility, tapi tidak melakukan apa-apa
  return null;
};

/**
 * Batalkan notifikasi yang sudah dijadwalkan
 * ⚠️ FIXED: Sekarang juga cleanup listener
 */
export const cancelScheduledNotification = async (): Promise<void> => {
  try {
    const notificationModule = await getNotifications();
    if (!notificationModule) {
      console.warn("Notifications not available - cannot cancel");
      return;
    }

    // Cleanup listener jika ada
    if (notificationListenerSubscription) {
      notificationListenerSubscription.remove();
      notificationListenerSubscription = null;
    }

    // Dapatkan ID notifikasi yang tersimpan
    const notificationId = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);

    if (notificationId) {
      await notificationModule.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
    }

    // Batalkan semua notifikasi yang pending (sebagai fallback)
    await notificationModule.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling scheduled notification:", error);
    throw error;
  }
};

/**
 * Cek apakah ada notifikasi yang sedang dijadwalkan
 */
export const checkScheduledNotifications = async (): Promise<boolean> => {
  try {
    const notificationModule = await getNotifications();
    if (!notificationModule) {
      return false;
    }

    const scheduledNotifications =
      await notificationModule.getAllScheduledNotificationsAsync();
    return scheduledNotifications.length > 0;
  } catch (error) {
    console.error("Error checking scheduled notifications:", error);
    return false;
  }
};

/**
 * Inisialisasi notifikasi saat app pertama kali dibuka
 */
export const initializeNotifications = async (): Promise<void> => {
  try {
    // Check notification support first
    const notificationModule = await getNotifications();
    if (!notificationModule) {
      console.warn(
        "Notifications not supported in this environment - skipping initialization"
      );
      return;
    }

    // Load pengaturan yang tersimpan
    const settings = await loadNotificationSettings();

    if (settings && settings.isEnabled) {
      // Periksa apakah timezone berubah
      const currentTimezone = getDeviceTimezone();

      if (settings.timezone !== currentTimezone) {
        // Update timezone dan jadwal ulang notifikasi
        const updatedSettings = {
          ...settings,
          timezone: currentTimezone,
        };

        await saveNotificationSettings(updatedSettings);
        await scheduleNotification(updatedSettings);
      } else {
        // Pastikan notifikasi masih aktif
        const hasScheduled = await checkScheduledNotifications();
        if (!hasScheduled) {
          await scheduleNotification(settings);
        }
      }
    }
  } catch (error) {
    console.error("Error initializing notifications:", error);
  }
};

/**
 * Format waktu untuk ditampilkan ke user
 */
export const formatTimeForDisplay = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * Validasi format waktu
 */
export const isValidTimeFormat = (timeString: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Cleanup notification listener
 * ⚠️ NEW: Function untuk cleanup listener saat app unmount
 */
export const cleanupNotificationListener = (): void => {
  if (notificationListenerSubscription) {
    notificationListenerSubscription.remove();
    notificationListenerSubscription = null;
  }
};
