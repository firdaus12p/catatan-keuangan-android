import { View } from "react-native";
import { Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationScreen } from "../src/screens/NotificationScreen";
import { colors, commonStyles } from "../src/styles/commonStyles";

export default function Notification() {
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <Appbar.Header
        style={[commonStyles.header, { backgroundColor: colors.notification }]}
      >
        <Appbar.Content
          title="💬 Notifikasi"
          subtitle="Pengingat dan Pemberitahuan"
          titleStyle={commonStyles.headerTitle}
          subtitleStyle={commonStyles.headerSubtitle}
        />
      </Appbar.Header>
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <NotificationScreen />
      </SafeAreaView>
    </View>
  );
}
