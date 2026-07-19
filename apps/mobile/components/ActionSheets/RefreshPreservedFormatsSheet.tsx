import { useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import ActionSheet, {
  ActionSheetRef,
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const linkId = props.payload?.linkId;

  const closeSheet = () => {
    actionSheetRef.current?.hide();
  };

  const handleRefresh = async () => {
    if (!linkId || loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${auth.instance}/api/v1/links/${linkId}/archive`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth.session}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.response || "Could not refresh the preserved formats."
        );
      }

      await deleteLinkCache(linkId);
      queryClient.invalidateQueries({ queryKey: ["link", linkId] });

      await SheetManager.hide(props.sheetId);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Could not refresh the preserved formats."
      );
    } finally {
      setLoading(false);
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
          isLoading={loading}
          variant="destructive"
          className="mt-5"
        >
          <Text className="text-white font-semibold">Refresh</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
