import { Alert, Text, View } from "react-native";
import { useRef, useState } from "react";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAddLink } from "@linkwarden/router/links";
import useAuthStore from "@/store/auth";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SheetHeader from "./SheetHeader";

export default function AddLinkSheet() {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { auth } = useAuthStore();
  const addLink = useAddLink({ auth, Alert });
  const [link, setLink] = useState("");
  const { colorScheme } = useColorScheme();

  const insets = useSafeAreaInsets();

  const closeSheet = () => {
    actionSheetRef.current?.hide();
    setLink("");
  };

  return (
    <ActionSheet
      ref={actionSheetRef}
      gestureEnabled
      indicatorStyle={{
        display: "none",
      }}
      containerStyle={{
        backgroundColor: rawTheme[colorScheme as ThemeName]["base-200"],
      }}
      safeAreaInsets={insets}
      onClose={() => {
        setLink("");
      }}
    >
      <SheetHeader title="New Link" onClose={closeSheet} />

      <View className="px-8 pb-5">
        <Input
          placeholder="e.g. https://example.com"
          className="mb-4 bg-base-100"
          value={link}
          onChangeText={setLink}
        />

        <Button
          onPress={() => {
            addLink.mutate({ url: link });

            actionSheetRef.current?.hide();
            setLink("");
          }}
          isLoading={addLink.isPending}
          variant="accent"
        >
          <Text className="text-white">Save to Linkwarden</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
