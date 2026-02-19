import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import { Check } from "lucide-react-native";
import { useAddLink } from "@linkwarden/router/links";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { SheetManager } from "react-native-actions-sheet";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";

export default function IncomingScreen() {
  const { auth } = useAuthStore();
  const router = useRouter();
  const { data, updateData } = useDataStore();
  const addLink = useAddLink({ auth });
  const { colorScheme } = useColorScheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>();

  useEffect(() => {
    if (auth.status === "authenticated" && data.shareIntent.url)
      addLink.mutate(
        {
          url: data.shareIntent.url,
          collection: { id: data.preferredCollection?.id },
        },
        {
          onSuccess: (e) => {
            setLink(e as unknown as LinkIncludingShortenedCollectionAndTags);
            setShowSuccess(true);
            setTimeout(() => {
              updateData({
                shareIntent: {
                  hasShareIntent: false,
                  url: "",
                },
              });
              router.replace("/dashboard");
            }, 1500);
          },
          onError: (error) => {
            Alert.alert("Error", "There was an error adding the link.");
            console.error("Error adding link:", error);
          },
        }
      );
  }, [auth, data.shareIntent.url]);

  if (auth.status === "unauthenticated") return <Redirect href="/" />;

  return (
    <SafeAreaView className="flex-1 bg-base-100">
      <View className="flex-1 items-center justify-center">
        {data?.shareIntent.url && showSuccess && link ? (
          <>
            <Check
              size={140}
              className="mb-3 text-base-content"
              color={rawTheme[colorScheme as ThemeName].primary}
            />
            <Text className="text-2xl font-semibold text-base-content">
              Link Saved!
            </Text>
            <TouchableOpacity
              className="w-fit mx-auto mt-5"
              onPress={() =>
                SheetManager.show("edit-link-sheet", {
                  payload: {
                    link: link,
                  },
                })
              }
            >
              <Text className="text-neutral text-center w-fit">Edit Link</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-3 text-base text-base-content opacity-70">
              One sec…
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
