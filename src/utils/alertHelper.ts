import { Alert } from "react-native";

/**
 * Utility functions untuk menampilkan Alert dengan pattern yang konsisten
 */

export const showError = (message: string, title: string = "Error"): void => {
  Alert.alert(title, message);
};

export const showSuccess = (
  message: string,
  title: string = "Sukses"
): void => {
  Alert.alert(title, message);
};

export const showWarning = (
  message: string,
  title: string = "Peringatan"
): void => {
  Alert.alert(title, message);
};

export const showInfo = (
  message: string,
  title: string = "Informasi"
): void => {
  Alert.alert(title, message);
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = "OK",
  cancelText: string = "Batal"
): void => {
  Alert.alert(title, message, [
    {
      text: cancelText,
      style: "cancel",
      onPress: onCancel,
    },
    {
      text: confirmText,
      onPress: onConfirm,
    },
  ]);
};

export const showDestructiveConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = "Hapus",
  cancelText: string = "Batal"
): void => {
  Alert.alert(title, message, [
    {
      text: cancelText,
      style: "cancel",
      onPress: onCancel,
    },
    {
      text: confirmText,
      style: "destructive",
      onPress: onConfirm,
    },
  ]);
};
