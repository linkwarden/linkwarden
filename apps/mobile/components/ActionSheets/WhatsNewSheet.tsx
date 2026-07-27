import { Dimensions, Linking, ScrollView, Text, View } from "react-native";
import ActionSheet, { SheetManager } from "react-native-actions-sheet";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { rawTheme, ThemeName } from "@/lib/colors";
import {
  WHATS_NEW_ITEMS,
  WHATS_NEW_LEARN_MORE_URL,
  WHATS_NEW_TITLE,
} from "@/lib/whatsNew";
import { Button } from "../ui/Button";
import SheetHeader from "./SheetHeader";

export default function WhatsNewSheet() {
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const insets = useSafeAreaInsets();

  const closeSheet = () => {
    SheetManager.hide("whats-new-sheet");
  };

  const openLearnMore = () => {
    if (WHATS_NEW_LEARN_MORE_URL) Linking.openURL(WHATS_NEW_LEARN_MORE_URL);
  };

  return (
    <ActionSheet
      gestureEnabled
      indicatorStyle={{
        display: "none",
      }}
      containerStyle={{
        backgroundColor: theme["base-100"],
      }}
      safeAreaInsets={insets}
    >
      <SheetHeader
        title={WHATS_NEW_TITLE}
        onClose={closeSheet}
        titleClassName="text-2xl"
        align="left"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          maxHeight: Dimensions.get("window").height * 0.7,
        }}
        contentContainerClassName="px-8 pb-5 flex-col gap-5"
      >
        {WHATS_NEW_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <View key={index} className="flex-row gap-4 items-start">
              <View
                className="mt-0.5 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: theme["base-200"] }}
              >
                <Icon size={20} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base-content text-lg font-semibold">
                  {item.title}
                </Text>
                <Text className="text-neutral text-base mt-0.5">
                  {item.description}
                </Text>
              </View>
            </View>
          );
        })}

        <View className="flex-col gap-3">
          <Button variant="primary" size="lg" onPress={closeSheet}>
            <Text className="text-base-100 text-xl">Got it</Text>
          </Button>

          {WHATS_NEW_LEARN_MORE_URL && (
            <Button variant="outline" size="lg" onPress={openLearnMore}>
              <Text className="text-base-content text-xl">Read the blog</Text>
            </Button>
          )}
        </View>
      </ScrollView>
    </ActionSheet>
  );
}
