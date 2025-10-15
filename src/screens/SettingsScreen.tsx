import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Card,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Switch,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { database } from "../db/database";
import { colors, commonStyles } from "../styles/commonStyles";
import ExpenseTypeScreen from "./ExpenseTypeScreen";

export default function SettingsScreen() {
  const router = useRouter();
  const [expenseTypeModalVisible, setExpenseTypeModalVisible] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    autoBackup: false,
    darkMode: false,
  });

  const handleResetData = () => {
    Alert.alert(
      "Reset Data",
      "Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await database.resetAllData();
              Alert.alert("Berhasil", "Semua data telah dihapus");
            } catch {
              Alert.alert("Error", "Gagal mereset data");
            }
          },
        },
      ]
    );
  };

  const handleResetTransactions = () => {
    Alert.alert(
      "Reset Transaksi",
      "Apakah Anda yakin ingin menghapus semua transaksi?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await database.resetTransactions();
              Alert.alert("Berhasil", "Semua transaksi telah dihapus");
            } catch {
              Alert.alert("Error", "Gagal mereset transaksi");
            }
          },
        },
      ]
    );
  };

  const handleResetLoans = () => {
    Alert.alert(
      "Reset Pinjaman",
      "Apakah Anda yakin ingin menghapus semua data pinjaman?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await database.resetLoans();
              Alert.alert("Berhasil", "Semua data pinjaman telah dihapus");
            } catch {
              Alert.alert("Error", "Gagal mereset data pinjaman");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <Appbar.Header
        style={[commonStyles.header, { backgroundColor: colors.secondary }]}
      >
        <Appbar.Content
          title="⚙️ Pengaturan"
          subtitle="Kelola Data dan Preferensi"
          titleStyle={commonStyles.headerTitle}
          subtitleStyle={commonStyles.headerSubtitle}
        />
        <Appbar.Action
          icon="notifications"
          onPress={() => router.push("/notification")}
          iconColor="#FFFFFF"
          style={{ marginTop: -23 }}
        />
      </Appbar.Header>

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Kelola Data */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Kelola Data</Text>

              <List.Item
                title="Kelola Jenis Pengeluaran"
                description="Tambah, edit, atau hapus jenis pengeluaran"
                left={(props) => <List.Icon {...props} icon="list-box" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setExpenseTypeModalVisible(true)}
                style={styles.listItem}
              />

              <Divider />

              <TouchableOpacity onPress={() => router.push("/reset")}>
                <List.Item
                  title="Reset Data"
                  description="Kelola dan reset data aplikasi"
                  left={(props) => <List.Icon {...props} icon="refresh" />}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-right" />
                  )}
                  style={styles.listItem}
                />
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Pengaturan Aplikasi */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Pengaturan Aplikasi</Text>

              <List.Item
                title="Notifikasi"
                description="Aktifkan notifikasi untuk pengingat"
                left={(props) => <List.Icon {...props} icon="bell" />}
                right={() => (
                  <Switch
                    value={settings.notifications}
                    onValueChange={(value) =>
                      setSettings({ ...settings, notifications: value })
                    }
                  />
                )}
                style={styles.listItem}
              />

              <Divider />

              <List.Item
                title="Backup Otomatis"
                description="Backup data secara otomatis"
                left={(props) => <List.Icon {...props} icon="cloud-upload" />}
                right={() => (
                  <Switch
                    value={settings.autoBackup}
                    onValueChange={(value) =>
                      setSettings({ ...settings, autoBackup: value })
                    }
                  />
                )}
                style={styles.listItem}
              />

              <Divider />

              <List.Item
                title="Mode Gelap"
                description="Ubah tampilan ke mode gelap"
                left={(props) => (
                  <List.Icon {...props} icon="theme-light-dark" />
                )}
                right={() => (
                  <Switch
                    value={settings.darkMode}
                    onValueChange={(value) =>
                      setSettings({ ...settings, darkMode: value })
                    }
                  />
                )}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>

          {/* Reset Actions */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Reset Data</Text>

              <List.Item
                title="Reset Transaksi"
                description="Hapus semua data transaksi"
                left={(props) => (
                  <List.Icon {...props} icon="receipt" color={colors.warning} />
                )}
                onPress={handleResetTransactions}
                style={styles.listItem}
              />

              <Divider />

              <List.Item
                title="Reset Pinjaman"
                description="Hapus semua data pinjaman"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="handshake"
                    color={colors.warning}
                  />
                )}
                onPress={handleResetLoans}
                style={styles.listItem}
              />

              <Divider />

              <List.Item
                title="Reset Semua Data"
                description="Hapus semua data aplikasi"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon="delete-forever"
                    color={colors.error}
                  />
                )}
                onPress={handleResetData}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>

          {/* Info Aplikasi */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Informasi</Text>

              <List.Item
                title="Versi Aplikasi"
                description="1.0.0"
                left={(props) => <List.Icon {...props} icon="information" />}
                style={styles.listItem}
              />

              <Divider />

              <List.Item
                title="Tentang CatatKu"
                description="Aplikasi pencatat keuangan pribadi"
                left={(props) => <List.Icon {...props} icon="help-circle" />}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal Kelola Jenis Pengeluaran */}
      <Portal>
        <Modal
          visible={expenseTypeModalVisible}
          onDismiss={() => setExpenseTypeModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kelola Jenis Pengeluaran</Text>
            <IconButton
              icon="close"
              onPress={() => setExpenseTypeModalVisible(false)}
            />
          </View>
          <View style={styles.modalContent}>
            <ExpenseTypeScreen />
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    flex: 1,
    padding: 0,
  },
});
