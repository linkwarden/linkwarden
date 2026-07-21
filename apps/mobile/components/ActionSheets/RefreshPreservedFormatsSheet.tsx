import { useRef } from "react";
import { Alert, Text, View } from "react-native";
import ActionSheet, {
  ActionSheetRef,
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUpdateArchive } from "@linkwarden/router/links";
import useAuthStore from "@/store/auth";
import { rawTheme, ThemeName } from "@/lib/colors";
import { deleteLinkCache } from "@/lib/cache";
import { Button } from "../ui/Button";
import SheetHeader from "./SheetHeader";

export default function RefreshPreservedFormatsSheet(
  props: SheetProps<"refresh-preserved-formats-sheet">
) {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const insets = useSafeAreaInsets();

  const { auth } = useAuthStore();

  const updateArchive = useUpdateArchive({
    auth,
    onAfterSuccess: (id) => deleteLinkCache(id),
  });

  const linkId = props.payload?.linkId;

  const closeSheet = () => {
    actionSheetRef.current?.hide();
  };

  const handleRefresh = async () => {
    if (!linkId || updateArchive.isPending) return;

    try {
      await updateArchive.mutateAsync(linkId);
      await SheetManager.hide(props.sheetId);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Could not refresh the preserved formats."
      );
    }
  };

  return (
    <ActionSheet
      ref={actionSheetRef}
      gestureEnabled
      indicatorStyle={{ display: "none" }}
      containerStyle={{ backgroundColor: theme["base-100"] }}
      safeAreaInsets={insets}
    >
      <SheetHeader
        title="Refresh Preserved Formats"
        onClose={closeSheet}
        align="left"
      />

      <View className="px-8 pb-5">
        <Text className="text-base-content">
          This will delete the current preserved formats and re-preserve this
          link.
        </Text>

        <Button
          onPress={handleRefresh}
          isLoading={updateArchive.isPending}
          variant="destructive"
          className="mt-5"
        >
          <Text className="text-white font-semibold">Refresh</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
