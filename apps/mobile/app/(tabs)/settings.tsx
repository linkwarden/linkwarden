import useAuthStore from "@/store/auth";
import { View, Text, StyleSheet, Button } from "react-native";

export default function SettingsScreen() {
  const { signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text>Settings</Text>
      <Button title="Sign out" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
