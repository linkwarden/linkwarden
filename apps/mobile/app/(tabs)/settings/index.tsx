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
import { useColorScheme } from "nativewind";

export default function SettingsScreen() {
  const { signOut, auth } = useAuthStore();
  const { data: user } = useUser(auth);
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <View
      style={styles.container}
      collapsable={false}
      collapsableChildren={false}
      className="bg-base-100"
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="bg-base-200 rounded-xl px-4 py-3">
          <Text className="font-semibold text-xl text-base-content">
            Your account
          </Text>
          <Text className="text-neutral mt-2 mb-3">
            {user?.email || "@" + user?.username}
          </Text>
          <View className="h-px bg-neutral-content -mr-4" />
          <TouchableOpacity
            className="flex-row items-center mt-3"
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
          <Text className="mb-4 mx-4 mt-6 text-neutral">Theme</Text>
          <View className="bg-base-200 rounded-xl flex-col">
            <TouchableOpacity className="flex-row gap-2 items-center justify-between py-3 px-4">
              <View className="flex-row items-center gap-2">
                <IconSymbol name="iphone" size={20} color="gray" />
                <Text className="text-neutral">System Defaults</Text>
              </View>
            </TouchableOpacity>
            <View className="h-px bg-neutral-content ml-12" />
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() => setColorScheme("light")}
            >
              <View className="flex-row items-center gap-2">
                <IconSymbol name="sun.max.fill" size={20} color="orange" />
                <Text className="text-orange-500">Light</Text>
              </View>
              {colorScheme === "light" ? (
                <IconSymbol name="checkmark" size={20} color="#3478f6" />
              ) : null}
            </TouchableOpacity>
            <View className="h-px bg-neutral-content ml-12" />
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() => setColorScheme("dark")}
            >
              <View className="flex-row items-center gap-2">
                <IconSymbol name="moon.fill" size={20} color="royalblue" />
                <Text className="text-blue-600">Dark</Text>
              </View>
              {colorScheme === "dark" ? (
                <IconSymbol name="checkmark" size={20} color="#3478f6" />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
        <Text className="mt-4 mx-auto text-sm text-neutral">
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
