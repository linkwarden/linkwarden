import { Text, View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import * as Clipboard from "expo-clipboard";
import { Button } from "../ui/Button";

export default function SupportSheet() {
  const { colorScheme } = useColorScheme();

  async function handleEmailPress() {
    await Clipboard.setStringAsync("support@linkwarden.app");
  }

  return (
    <ActionSheet
      gestureEnabled
      indicatorStyle={{
        backgroundColor: rawTheme[colorScheme as ThemeName]["neutral-content"],
      }}
      containerStyle={{
        backgroundColor: rawTheme[colorScheme as ThemeName]["base-100"],
      }}
    >
      <View className="px-8 py-5 flex-col gap-4">
        <Text className="text-2xl font-bold text-base-content">Need help?</Text>
        <Text className="text-base-content">
          Whether you have a question or need assistance, feel free to reach out
          to us at support@linkwarden.app
        </Text>
        <Button onPress={handleEmailPress} variant="outline">
          <Text className="text-base-content">Copy Support Email</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
