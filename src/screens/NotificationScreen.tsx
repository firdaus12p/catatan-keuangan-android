import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  List,
  Modal,
  Portal,
  Switch,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../styles/commonStyles";
import {
  NotificationSettings,
  cancelScheduledNotification,
  checkScheduledNotifications,
  formatTimeForDisplay,
  getDeviceTimezone,
  loadNotificationSettings,
  requestNotificationPermissions,
  saveNotificationSettings,
  scheduleNotification,
} from "../utils/notificationHelper";

export const NotificationScreen: React.FC = React.memo(() => {
  const [settings, setSettings] = useState<NotificationSettings>({
    isEnabled: false,
    time: "20:30",
    timezone: getDeviceTimezone(),
  });

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [hasActiveNotification, setHasActiveNotification] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load pengaturan saat screen difokuskan
  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      // Hanya tampilkan loading pada load pertama kali
      if (!isInitialized) {
        setLoading(true);
      }

      const savedSettings = await loadNotificationSettings();

      if (savedSettings) {
        setSettings(savedSettings);

        // Update timezone jika berubah
        const currentTimezone = getDeviceTimezone();
        if (savedSettings.timezone !== currentTimezone) {
          const updatedSettings = {
            ...savedSettings,
            timezone: currentTimezone,
          };
          setSettings(updatedSettings);
          await saveNotificationSettings(updatedSettings);
        }
      }

      // Cek status notifikasi aktif
      const hasScheduled = await checkScheduledNotifications();
      setHasActiveNotification(hasScheduled);
    } catch (error) {
      console.error("Error loading notification settings:", error);
      Alert.alert("Error", "Gagal memuat pengaturan notifikasi");
    } finally {
      // Hanya set loading false dan mark sebagai initialized pada load pertama
      if (!isInitialized) {
        setLoading(false);
        setIsInitialized(true);
      }
    }
  };

  const handleToggleNotification = async (enabled: boolean) => {
    try {
      // Jika mengaktifkan notifikasi, cek permission terlebih dahulu
      if (enabled) {
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            "Permission Diperlukan",
            __DEV__
              ? "Di Expo Go, fitur notifikasi terbatas. Untuk testing lengkap, gunakan production build (APK). Atau aktifkan manual di pengaturan sistem Android."
              : "Aplikasi memerlukan izin notifikasi untuk mengirim pengingat. Silakan aktifkan di pengaturan perangkat."
          );
          return;
        }
      }

      const updatedSettings = {
        ...settings,
        isEnabled: enabled,
      };

      setSettings(updatedSettings);
      await saveNotificationSettings(updatedSettings);

      if (enabled) {
        // Jadwalkan notifikasi
        await scheduleNotification(updatedSettings);
        setHasActiveNotification(true);
        Alert.alert(
          "Notifikasi Diaktifkan",
          `Pengingat akan dikirim setiap hari pada pukul ${formatTimeForDisplay(
            updatedSettings.time
          )}`
        );
      } else {
        // Batalkan notifikasi
        await cancelScheduledNotification();
        setHasActiveNotification(false);
        Alert.alert(
          "Notifikasi Dinonaktifkan",
          "Pengingat harian telah dibatalkan"
        );
      }
    } catch (error) {
      console.error("Error toggling notification:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("tidak didukung di environment ini")) {
        Alert.alert(
          "Expo Go Limitation",
          "Notifikasi terbatas di Expo Go. Di production build (APK), fitur ini akan bekerja normal dengan permission dialog otomatis."
        );
      } else {
        Alert.alert("Error", `Gagal mengatur notifikasi: ${errorMessage}`);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === "android") {
      setTimePickerVisible(false);
    }

    if (selectedTime) {
      setTempTime(selectedTime);

      if (Platform.OS === "android") {
        // Langsung simpan pada Android
        saveTimeChange(selectedTime);
      }
    }
  };

  const saveTimeChange = async (selectedTime: Date) => {
    try {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      const updatedSettings = {
        ...settings,
        time: timeString,
      };

      setSettings(updatedSettings);
      await saveNotificationSettings(updatedSettings);

      // Jika notifikasi aktif, jadwal ulang dengan waktu baru
      if (updatedSettings.isEnabled) {
        await scheduleNotification(updatedSettings);
        Alert.alert(
          "Waktu Diperbarui",
          `Pengingat akan dikirim setiap hari pada pukul ${formatTimeForDisplay(
            timeString
          )}`
        );
      }

      setTimePickerVisible(false);
    } catch (error) {
      console.error("Error saving time change:", error);
      Alert.alert("Error", "Gagal menyimpan perubahan waktu");
    }
  };

  const showTimePicker = () => {
    const [hours, minutes] = settings.time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    setTempTime(date);
    setTimePickerVisible(true);
  };

  const testNotification = async () => {
    try {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert("Error", "Permission notifikasi diperlukan");
        return;
      }

      // Kirim test notification
      await scheduleNotification({
        ...settings,
        time: new Date(Date.now() + 3000).toTimeString().slice(0, 5), // 3 detik dari sekarang
      });

      Alert.alert(
        "Test Notifikasi",
        "Notifikasi test akan muncul dalam 3 detik"
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert("Error", "Gagal mengirim test notifikasi");
    }
  };

  // Memoize status notification untuk mencegah re-calculation
  const notificationStatus = useMemo(
    () => ({
      isActive: settings.isEnabled,
      displayTime: formatTimeForDisplay(settings.time),
      statusText: settings.isEnabled
        ? "Notifikasi Aktif"
        : "Notifikasi Nonaktif",
      subtitle: settings.isEnabled
        ? `Pengingat harian pada pukul ${formatTimeForDisplay(settings.time)}`
        : "Tidak ada pengingat yang dijadwalkan",
      iconName: settings.isEnabled
        ? "notifications-active"
        : "notifications-off",
      iconColor: settings.isEnabled ? "#4CAF50" : "#999999",
    }),
    [settings.isEnabled, settings.time]
  );

  if (loading && !isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content
            title="Pengaturan Notifikasi"
            titleStyle={styles.headerTitle}
          />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat pengaturan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content
          title="Pengaturan Notifikasi"
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Card style={styles.statusCard} elevation={2}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <MaterialIcons
                name={notificationStatus.iconName as any}
                size={32}
                color={notificationStatus.iconColor}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {notificationStatus.statusText}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {notificationStatus.subtitle}
                </Text>
              </View>
            </View>

            {hasActiveNotification && settings.isEnabled && (
              <View style={styles.activeIndicator}>
                <MaterialIcons name="schedule" size={16} color="#4CAF50" />
                <Text style={styles.activeText}>
                  Notifikasi dijadwalkan untuk zona waktu: {settings.timezone}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Pengaturan */}
        <Card style={styles.settingsCard} elevation={1}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Pengaturan</Text>

            {/* Toggle Notifikasi */}
            <List.Item
              title="Aktifkan Notifikasi"
              description="Terima pengingat harian untuk mencatat keuangan"
              left={(props) => (
                <List.Icon {...props} icon="bell" color="#2196F3" />
              )}
              right={() => (
                <Switch
                  value={settings.isEnabled}
                  onValueChange={handleToggleNotification}
                  color="#2196F3"
                />
              )}
              style={styles.listItem}
            />

            {/* Pengaturan Waktu */}
            <List.Item
              title="Waktu Pengingat"
              description={`Setiap hari pada pukul ${notificationStatus.displayTime}`}
              left={(props) => (
                <List.Icon {...props} icon="clock" color="#FF9800" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={showTimePicker}
              disabled={!settings.isEnabled}
              style={[
                styles.listItem,
                !settings.isEnabled && styles.disabledItem,
              ]}
            />

            {/* Zona Waktu */}
            <List.Item
              title="Zona Waktu"
              description={`Otomatis (${settings.timezone})`}
              left={(props) => (
                <List.Icon {...props} icon="earth" color="#9C27B0" />
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard} elevation={1}>
          <Card.Content>
            <Text style={styles.infoTitle}>ℹ️ Informasi</Text>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                • Notifikasi akan tetap aktif meski aplikasi ditutup
              </Text>
              <Text style={styles.infoItem}>
                • Waktu mengikuti zona waktu perangkat Anda
              </Text>
              <Text style={styles.infoItem}>
                • Pengingat dikirim setiap hari pada waktu yang ditentukan
              </Text>
              <Text style={styles.infoItem}>
                • Pastikan izin notifikasi diaktifkan di pengaturan sistem
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Test Button */}
        {settings.isEnabled && (
          <Card style={styles.testCard} elevation={1}>
            <Card.Content>
              <Button
                mode="outlined"
                onPress={testNotification}
                icon="send"
                style={styles.testButton}
              >
                Test Notifikasi
              </Button>
              <Text style={styles.testDescription}>
                Kirim notifikasi test untuk memastikan pengaturan bekerja
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Portal>
        <Modal
          visible={timePickerVisible}
          onDismiss={() => setTimePickerVisible(false)}
          contentContainerStyle={styles.timePickerModal}
        >
          <Text style={styles.modalTitle}>Pilih Waktu Pengingat</Text>

          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={tempTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
          </View>

          {Platform.OS === "ios" && (
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setTimePickerVisible(false)}
                style={styles.modalButton}
              >
                Batal
              </Button>
              <Button
                mode="contained"
                onPress={() => saveTimeChange(tempTime)}
                style={styles.modalButton}
              >
                Simpan
              </Button>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: colors.notification,
    elevation: 4,
    height: 20,
    minHeight: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    marginTop: -25,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    paddingBottom: 100, // Extra padding untuk memastikan card terakhir tidak terpotong
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },
  statusCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    padding: 12,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 6,
    flex: 1,
  },
  settingsCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.notification,
    marginBottom: 8,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  disabledItem: {
    opacity: 0.5,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#FFF9E6",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },
  infoList: {
    marginLeft: 8,
  },
  infoItem: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 6,
    lineHeight: 20,
  },
  testCard: {
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  testButton: {
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  timePickerModal: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 20,
  },
  timePickerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  timePicker: {
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
