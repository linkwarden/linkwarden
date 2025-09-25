import useAuthStore from "@/store/auth";
import { useUser } from "@linkwarden/router/user";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { nativeApplicationVersion } from "expo-application";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useEffect, useState } from "react";
import {
  Check,
  FileText,
  Globe,
  LogOut,
  Mail,
  Moon,
  Smartphone,
  Sun,
} from "lucide-react-native";
import useDataStore from "@/store/data";
import { ArchivedFormat } from "@/types/global";
import * as Clipboard from "expo-clipboard";

export default function SettingsScreen() {
  const { signOut, auth } = useAuthStore();
  const { data: user } = useUser(auth);
  const { colorScheme, setColorScheme } = useColorScheme();
  const { data, updateData } = useDataStore();
  const [override, setOverride] = useState<"light" | "dark" | "system">(
    data.theme || "system"
  );

  useEffect(() => {
    setColorScheme(override);
    updateData({ theme: override });
  }, [override]);

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
        contentContainerClassName="flex-col gap-6"
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
            <LogOut size={18} color="red" />
          </TouchableOpacity>
        </View>

        <View>
          <Text className="mb-4 mx-4 text-neutral">Theme</Text>
          <View className="bg-base-200 rounded-xl flex-col">
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() => setOverride("system")}
            >
              <View className="flex-row items-center gap-2">
                <Smartphone
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-neutral">System Defaults</Text>
              </View>
              {override === "system" ? (
                <Check
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              ) : null}
            </TouchableOpacity>
            <View className="h-px bg-neutral-content ml-12" />
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() => setOverride("light")}
            >
              <View className="flex-row items-center gap-2">
                <Sun size={20} color="orange" />
                <Text className="text-orange-500 dark:text-orange-400">
                  Light
                </Text>
              </View>
              {override === "light" ? (
                <Check
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              ) : null}
            </TouchableOpacity>
            <View className="h-px bg-neutral-content ml-12" />
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() => setOverride("dark")}
            >
              <View className="flex-row items-center gap-2">
                <Moon size={20} color="royalblue" />
                <Text className="text-blue-600 dark:text-blue-400">Dark</Text>
              </View>
              {override === "dark" ? (
                <Check
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text className="mb-4 mx-4 text-neutral">
            Default Behavior for Opening Links
          </Text>
          <View className="bg-base-200 rounded-xl flex-col">
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() =>
                updateData({
                  preferredFormat: null,
                })
              }
            >
              <View className="flex-row items-center gap-2">
                <Globe
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-base-content">Open original content</Text>
              </View>
              {data.preferredFormat === null ? (
                <Check
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              ) : null}
            </TouchableOpacity>
            <View className="h-px bg-neutral-content ml-12" />
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() =>
                updateData({
                  preferredFormat: ArchivedFormat.readability,
                })
              }
            >
              <View className="flex-row items-center gap-2">
                <FileText
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-base-content">Open reader view</Text>
              </View>
              {data.preferredFormat === ArchivedFormat.readability ? (
                <Check
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text className="mb-4 mx-4 text-neutral">Contact Us</Text>
          <View className="bg-base-200 rounded-xl flex-col">
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={async () => {
                await Clipboard.setStringAsync("support@linkwarden.app");
                Alert.alert("Copied to clipboard", "support@linkwarden.app");
              }}
            >
              <View className="flex-row items-center gap-2">
                <Mail
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-base-content">
                  support@linkwarden.app
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="mx-auto text-sm text-neutral">
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
