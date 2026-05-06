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
  Switch,
  ActivityIndicator,
} from "react-native";
import { nativeApplicationVersion } from "expo-application";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useEffect, useState } from "react";
import {
  AppWindowMac,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Folder,
  HardDrive,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  Smartphone,
  Sun,
  Trash2,
} from "lucide-react-native";
import { clearCache } from "@/lib/cache";
import {
  formatBytes,
  recomputeStorage,
  useOfflineSyncStore,
} from "@/lib/offlineSync";
import useDataStore from "@/store/data";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";

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

  const router = useRouter();

  const syncStatus = useOfflineSyncStore((s) => s.status);
  const syncProcessed = useOfflineSyncStore((s) => s.processed);
  const syncTotal = useOfflineSyncStore((s) => s.total);
  const bytesUsed = useOfflineSyncStore((s) => s.bytesUsed);
  const syncPercent =
    syncTotal > 0 ? Math.floor((syncProcessed / syncTotal) * 100) : null;
  const syncStatusLabel =
    syncStatus === "paused"
      ? "Waiting for connection"
      : syncPercent === null
        ? "Preparing…"
        : syncPercent >= 100
          ? "Up to date"
          : `${syncPercent}%`;

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
          <Text className="mb-4 mx-4 text-neutral">Preferred Browser</Text>
          <View className="bg-base-200 rounded-xl flex-col">
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() =>
                updateData({
                  preferredBrowser: "app",
                })
              }
            >
              <View className="flex-row items-center gap-2">
                <AppWindowMac
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-base-content">In app browser</Text>
              </View>
              {data.preferredBrowser === "app" ? (
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
                  preferredBrowser: "system",
                })
              }
            >
              <View className="flex-row items-center gap-2">
                <ExternalLink
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-base-content">
                  System default browser
                </Text>
              </View>
              {data.preferredBrowser === "system" ? (
                <Check
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text className="mb-4 mx-4 text-neutral">Save Shared Links To</Text>
          <View className="bg-base-200 rounded-xl flex-col">
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              onPress={() => router.navigate("/settings/preferredCollection")}
            >
              <View className="flex-row items-center gap-2">
                <Folder
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-base-content">Preferred collection</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text numberOfLines={1} className="text-neutral max-w-[140px]">
                  {data.preferredCollection?.name || "None"}
                </Text>
                <ChevronRight
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text className="mb-4 mx-4 text-neutral">Offline Storage</Text>
          <View className="bg-base-200 rounded-xl flex-col">
            <View className="py-3 px-4">
              <View className="flex-row gap-2 items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Download
                    size={20}
                    color={rawTheme[colorScheme as ThemeName].neutral}
                  />
                  <Text className="text-base-content">
                    Save for offline access
                  </Text>
                </View>
                <Switch
                  value={!!data.offlineEnabled}
                  onValueChange={(value) =>
                    updateData({ offlineEnabled: value })
                  }
                  trackColor={{
                    true: rawTheme[colorScheme as ThemeName].primary,
                  }}
                  thumbColor={rawTheme[colorScheme as ThemeName]["base-100"]}
                />
              </View>
              <Text className="text-sm text-neutral mt-2 ml-7">
                Automatically saves preserved formats for links loaded in the
                app to this device for offline access. When this is off, only
                formats you open are saved.
              </Text>
            </View>
            {data.offlineEnabled ? (
              <>
                <View className="h-px bg-neutral-content ml-12" />
                <View className="flex-row gap-2 items-center justify-between py-3 px-4">
                  <View className="flex-row items-center gap-2">
                    <RefreshCw
                      size={20}
                      color={rawTheme[colorScheme as ThemeName].neutral}
                    />
                    <Text className="text-base-content">Offline sync</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {syncStatus === "syncing" ? (
                      <ActivityIndicator
                        size="small"
                        color={rawTheme[colorScheme as ThemeName].primary}
                      />
                    ) : null}
                    <Text className="text-neutral">{syncStatusLabel}</Text>
                  </View>
                </View>
              </>
            ) : null}
            <View className="h-px bg-neutral-content ml-12" />
            <View className="flex-row gap-2 items-center justify-between py-3 px-4">
              <View className="flex-row items-center gap-2">
                <HardDrive
                  size={20}
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
                <Text className="text-base-content">Storage used</Text>
              </View>
              <Text className="text-neutral">{formatBytes(bytesUsed)}</Text>
            </View>
            <View className="h-px bg-neutral-content ml-12" />
            <TouchableOpacity
              className="flex-row gap-2 items-center justify-between py-3 px-4"
              disabled={syncStatus === "syncing"}
              onPress={() =>
                Alert.alert(
                  "Clear cache",
                  "This will delete all downloaded formats and previews from this device.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: async () => {
                        await clearCache();
                        useOfflineSyncStore.getState().reset();
                        await recomputeStorage();
                      },
                    },
                  ]
                )
              }
            >
              <View className="flex-row items-center gap-2">
                <Trash2
                  size={20}
                  color={syncStatus === "syncing" ? "gray" : "red"}
                />
                <Text
                  className={
                    syncStatus === "syncing" ? "text-neutral" : "text-red-500"
                  }
                >
                  Clear cache
                </Text>
              </View>
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
  container: Platform.select({
    ios: {
      flex: 1,
      paddingBottom: 83,
    },
    default: {
      flex: 1,
    },
  }),
});
