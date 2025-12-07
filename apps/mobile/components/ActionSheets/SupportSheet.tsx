import { Text, View } from "react-native";
import { useState } from "react";
import ActionSheet from "react-native-actions-sheet";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import * as Clipboard from "expo-clipboard";
import { Button } from "../ui/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SupportSheet() {
  const { colorScheme } = useColorScheme();
  const [copied, setCopied] = useState(false);

  async function handleEmailPress() {
    await Clipboard.setStringAsync("support@linkwarden.app");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const insets = useSafeAreaInsets();

  return (
    <ActionSheet
      gestureEnabled
      indicatorStyle={{
        backgroundColor: rawTheme[colorScheme as ThemeName]["neutral-content"],
      }}
      containerStyle={{
        backgroundColor: rawTheme[colorScheme as ThemeName]["base-100"],
      }}
      safeAreaInsets={insets}
    >
      <View className="px-8 py-5 flex-col gap-4">
        <Text className="text-2xl font-bold text-base-content">Need help?</Text>
        <Text className="text-base-content">
          Whether you have a question or need assistance, feel free to reach out
          to us at support@linkwarden.app
        </Text>
        <Button onPress={handleEmailPress} variant="outline">
          <Text className="text-base-content">
            {copied ? "Copied!" : "Copy Support Email"}
          </Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
