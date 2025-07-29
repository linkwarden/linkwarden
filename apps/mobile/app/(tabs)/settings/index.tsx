import useAuthStore from "@/store/auth";
import { View, Text, StyleSheet, Button, ScrollView } from "react-native";

export default function SettingsScreen() {
  const { signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          flexDirection: "column",
          gap: 15,
          paddingVertical: 20,
          alignItems: "center",
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text>Settings</Text>
        <Button title="Sign out" onPress={() => signOut()} />
      </ScrollView>
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
