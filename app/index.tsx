import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export default function Index() {
  useEffect(() => {
    // Redirect ke tabs setelah splash screen
    const timer = setTimeout(() => {
      router.replace("/(tabs)/" as any);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💸 Kemenku</Text>
      <Text style={styles.subtitle}>Kementrian Keuangan Pribadi</Text>
      <ActivityIndicator
        animating={true}
        color="#2196F3"
        size="large"
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
  },
  loader: {
    marginTop: 20,
  },
});
