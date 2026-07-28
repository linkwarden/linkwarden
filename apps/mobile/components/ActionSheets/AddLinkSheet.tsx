import { Alert, Text, View } from "react-native";
import { useRef, useState } from "react";
import ActionSheet, {
  ActionSheetRef,
  SheetProps,
} from "react-native-actions-sheet";
import { Folder, Tag } from "lucide-react-native";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAddLink } from "@linkwarden/router/links";
import useAuthStore from "@/store/auth";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SheetHeader from "./SheetHeader";

export default function AddLinkSheet(props: SheetProps<"add-link-sheet">) {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { auth } = useAuthStore();
  const addLink = useAddLink({ auth, Alert });
  const [link, setLink] = useState("");
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];

  const collection = props.payload?.collection;
  const tag = props.payload?.tag;

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
          autoCapitalize="none"
          value={link}
          onChangeText={setLink}
        />

        {collection?.name || tag?.name ? (
          <View className="mb-4 flex-row items-center gap-2">
            {collection?.name ? (
              <View className="flex-row items-center gap-1.5 rounded-full bg-base-100 px-3 py-1.5">
                <Folder size={14} color={theme.primary} />
                <Text className="text-sm text-base-content">
                  {collection.name}
                </Text>
              </View>
            ) : null}
            {tag?.name ? (
              <View className="flex-row items-center gap-1.5 rounded-full bg-base-100 px-3 py-1.5">
                <Tag size={14} color={theme.primary} />
                <Text className="text-sm text-base-content">{tag.name}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Button
          onPress={() => {
            addLink.mutate({
              url: link,
              ...(collection?.id != null || collection?.name
                ? {
                    collection: {
                      ...(collection.id != null ? { id: collection.id } : {}),
                      ...(collection.name ? { name: collection.name } : {}),
                    },
                  }
                : {}),
              ...(tag?.name
                ? {
                    tags: [
                      {
                        name: tag.name,
                        ...(tag.id != null ? { id: tag.id } : {}),
                      },
                    ],
                  }
                : {}),
            });

            actionSheetRef.current?.hide();
            setLink("");
          }}
          isLoading={addLink.isPending}
          variant="primary"
        >
          <Text className="text-base-100">Save to Linkwarden</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
