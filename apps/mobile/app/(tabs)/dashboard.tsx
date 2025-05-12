import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Dashboard</Text>
      {/* <TouchableOpacity>
        <IconSymbol size={20} name="plus" color={""} />
      </TouchableOpacity> */}
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
