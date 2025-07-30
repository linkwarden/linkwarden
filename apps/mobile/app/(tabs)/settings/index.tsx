import { IconSymbol } from "@/components/ui/IconSymbol";
import useAuthStore from "@/store/auth";
import { useUser } from "@linkwarden/router/user";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { nativeApplicationVersion } from "expo-application";

export default function SettingsScreen() {
  const { signOut, auth } = useAuthStore();
  const { data: user } = useUser(auth);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="bg-white rounded-xl px-4 py-3">
          <Text className="font-semibold text-xl">Your account</Text>
          <Text className="text-gray-500 mt-2 mb-3">
            {user?.email || "@" + user?.username}
          </Text>
          <View className="h-px bg-gray-300 -mr-4" />
          <TouchableOpacity
            className="flex-row items-center mt-3 bg-white"
            onPress={() =>
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Sign Out",
                  style: "destructive",
                  onPress: () => {
                    signOut();
                  },
                },
              ])
            }
          >
            <Text className="flex-1 text-base text-red-500">Sign Out</Text>
            <IconSymbol
              name="rectangle.portrait.and.arrow.right"
              size={18}
              color="red"
            />
          </TouchableOpacity>
        </View>

        <View>
          <Text className="mb-4 mx-4 mt-6 text-gray-500">Settings</Text>
          <View className="bg-white rounded-xl flex-col">
            <TouchableOpacity className="flex-row items-center py-3 px-4">
              <Text className="flex-1 text-base">Settings</Text>
              <IconSymbol name="chevron.right" size={18} color="gray" />
            </TouchableOpacity>
            <View className="h-px bg-gray-300 ml-4" />
            <TouchableOpacity className="flex-row items-center py-3 px-4">
              <Text className="flex-1 text-base">Settings</Text>
              <IconSymbol name="chevron.right" size={18} color="gray" />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="mt-4 mx-auto text-sm text-gray-500">
          Linkwarden for {Platform.OS === "ios" ? "iOS" : "Android"}{" "}
          {nativeApplicationVersion}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
