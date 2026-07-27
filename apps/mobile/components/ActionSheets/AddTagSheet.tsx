import { Alert, Text, View } from "react-native";
import { useRef, useState } from "react";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import useAuthStore from "@/store/auth";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { useUpsertTags } from "@linkwarden/router/tags";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SheetHeader from "./SheetHeader";

export default function AddTagSheet() {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { auth } = useAuthStore();
  const upsertTags = useUpsertTags(auth);
  const [name, setName] = useState("");
  const { colorScheme } = useColorScheme();

  const insets = useSafeAreaInsets();

  const closeSheet = () => {
    actionSheetRef.current?.hide();
    setName("");
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
        setName("");
      }}
    >
      <SheetHeader title="New Tag" onClose={closeSheet} />

      <View className="px-8 pb-5">
        <Input
          placeholder="Name"
          className="mb-4 bg-base-100"
          autoCapitalize="none"
          value={name}
          onChangeText={setName}
        />

        <Button
          onPress={() =>
            upsertTags.mutate([{ label: name.trim() }], {
              onSuccess: () => {
                actionSheetRef.current?.hide();
                setName("");
              },
              onError: (error) => {
                Alert.alert("Error", "There was an error creating the tag.");
                console.error("Error creating tag:", error);
              },
            })
          }
          disabled={name.trim().length === 0}
          isLoading={upsertTags.isPending}
          variant="primary"
        >
          <Text className="text-base-100">Save Tag</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
