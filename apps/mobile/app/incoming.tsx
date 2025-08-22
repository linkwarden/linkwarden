import React, { useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import { Check } from "lucide-react-native";
import { useAddLink } from "@linkwarden/router/links";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";

export default function IncomingScreen() {
  const { auth } = useAuthStore();
  const router = useRouter();
  const { data, updateData } = useDataStore();
  const addLink = useAddLink(auth);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (auth.status === "authenticated" && data.shareIntent.url)
      addLink.mutate(
        { url: data.shareIntent.url },
        {
          onSuccess: () => {
            setTimeout(() => {
              updateData({
                shareIntent: {
                  hasShareIntent: false,
                  url: "",
                },
              });
              router.replace("/dashboard");
            }, 1000);
          },
          onError: (error) => {
            Alert.alert("Error", "There was an error adding the link.");
            console.error("Error adding link:", error);
          },
        }
      );
  }, [auth, data.shareIntent.url]);

  if (auth.status === "unauthenticated") return <Redirect href="/login" />;

  return (
    <SafeAreaView className="flex-1 bg-base-100">
      {data?.shareIntent.url ? (
        <View className="flex-1 items-center justify-center">
          <Check
            size={140}
            className="mb-3 text-base-content"
            color={rawTheme[colorScheme as ThemeName].primary}
          />
          <Text className="text-2xl font-semibold text-base-content">
            Link Saved!
          </Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
          <Text className="mt-3 text-base text-base-content opacity-70">
            One sec… {String(data?.shareIntent.url)}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
});
