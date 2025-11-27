import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { StyleSheet } from "react-native";
import { FAB, Portal } from "react-native-paper";
import { useAllocationValidator } from "../hooks/useAllocationValidator";
import { colors } from "../styles/commonStyles";

export const FloatingActionButtons: React.FC = React.memo(() => {
  const [open, setOpen] = useState(false);
  const [isNavigating, startTransition] = useTransition();
  const router = useRouter();

  // Gunakan custom hook untuk validasi alokasi
  const { hasCategories, validateAllocationForNavigation } =
    useAllocationValidator();

  useEffect(() => {
    router.prefetch({ pathname: "/(tabs)/transaction" });
    router.prefetch({ pathname: "/(tabs)/category" });
    router.prefetch({ pathname: "/(tabs)/loan" });
  }, [router]);

  const onStateChange = useCallback(({ open }: { open: boolean }) => {
    setOpen(open);
  }, []);

  type TargetRoute =
    | { pathname: "/(tabs)/transaction"; params?: Record<string, string> }
    | { pathname: "/(tabs)/category"; params?: Record<string, string> }
    | { pathname: "/(tabs)/loan"; params?: Record<string, string> };

  const navigate = useCallback(
    (target: TargetRoute) => {
      startTransition(() => {
        router.push(target);
      });
    },
    [router]
  );

  const handlePemasukanPress = useCallback(() => {
    if (!validateAllocationForNavigation()) {
      setOpen(false);
      return;
    }

    setOpen(false);
    navigate({
      pathname: "/(tabs)/transaction",
      params: { action: "income" },
    });
  }, [navigate, validateAllocationForNavigation]);

  const handlePengeluaranPress = useCallback(() => {
    if (!validateAllocationForNavigation()) {
      setOpen(false);
      return;
    }

    setOpen(false);
    navigate({
      pathname: "/(tabs)/transaction",
      params: { action: "expense" },
    });
  }, [navigate, validateAllocationForNavigation]);

  const handlePinjamanPress = useCallback(() => {
    setOpen(false);
    navigate({
      pathname: "/(tabs)/loan",
      params: { action: "add" },
    });
  }, [navigate]);

  const handleKategoriPress = useCallback(() => {
    setOpen(false);
    navigate({
      pathname: "/(tabs)/category",
      params: { action: "add" },
    });
  }, [navigate]);

  const actions = useMemo(
    () => [
      {
        icon: () => (
          <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
        ),
        label: "Pemasukan",
        onPress: handlePemasukanPress,
        style: { backgroundColor: colors.income },
        labelTextColor: colors.income,
        size: "medium" as const,
        disabled: isNavigating || !hasCategories,
      },
      {
        icon: () => (
          <MaterialIcons name="trending-down" size={24} color="#FFFFFF" />
        ),
        label: "Pengeluaran",
        onPress: handlePengeluaranPress,
        style: { backgroundColor: colors.expense },
        labelTextColor: colors.expense,
        size: "medium" as const,
        disabled: isNavigating || !hasCategories,
      },
      {
        icon: () => (
          <MaterialIcons name="handshake" size={24} color="#FFFFFF" />
        ),
        label: "Tambah Pinjaman",
        onPress: handlePinjamanPress,
        style: { backgroundColor: colors.loan },
        labelTextColor: colors.loan,
        size: "medium" as const,
        disabled: isNavigating || !hasCategories,
      },
      {
        icon: () => <MaterialIcons name="category" size={24} color="#FFFFFF" />,
        label: "Tambah Kategori",
        onPress: handleKategoriPress,
        style: { backgroundColor: colors.category },
        labelTextColor: colors.category,
        size: "medium" as const,
        disabled: isNavigating || !hasCategories,
      },
    ],
    [
      handleKategoriPress,
      handlePengeluaranPress,
      handlePemasukanPress,
      handlePinjamanPress,
      hasCategories,
      isNavigating,
    ]
  );

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible={true}
        icon={open ? "close" : "plus"}
        actions={actions}
        onStateChange={onStateChange}
        onPress={() => {
          if (open) {
            // do something if the speed dial is open
          }
        }}
        fabStyle={styles.fab}
        style={styles.fabGroup}
        theme={{
          colors: {
            backdrop: "rgba(0, 0, 0, 0.5)",
          },
        }}
      />
    </Portal>
  );
});

const styles = StyleSheet.create({
  fabGroup: {
    paddingBottom: 95, // Memberikan ruang agar tidak menutupi tab navigation
  },
  fab: {
    backgroundColor: colors.primary,
    elevation: 8, // Add more elevation for better visual
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
