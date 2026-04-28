import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet, {
  FlatList,
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { Trash2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Highlight } from "@linkwarden/prisma/client";
import {
  useGetLinkHighlights,
  useRemoveHighlight,
} from "@linkwarden/router/highlights";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { HIGHLIGHT_COLORS } from "./ReadableHighlightSheet";

const highlightColorMap = Object.fromEntries(
  HIGHLIGHT_COLORS.map((colorOption) => [colorOption.name, colorOption])
);

function getHighlightColors(color?: string | null) {
  return (
    highlightColorMap[color as keyof typeof highlightColorMap] ||
    HIGHLIGHT_COLORS[0]
  );
}

function formatHighlightDate(createdAt: Highlight["createdAt"]) {
  return new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReadableHighlightsSheet(
  props: SheetProps<"readable-highlights-sheet">
) {
  const linkId = props.payload?.linkId ?? 0;
  const { auth } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];
  const { data, isLoading } = useGetLinkHighlights(linkId, auth);
  const removeHighlight = useRemoveHighlight(linkId, auth);
  const [deletingHighlightId, setDeletingHighlightId] = useState<number | null>(
    null
  );

  const highlights = useMemo(
    () =>
      [...(data ?? [])].sort(
        (left, right) => left.startOffset - right.startOffset
      ),
    [data]
  );

  const closeSheet = () => {
    void SheetManager.hide(props.sheetId, {
      payload: null,
    });
  };

  const handleSelectHighlight = (highlightId: number) => {
    void SheetManager.hide(props.sheetId, {
      payload: highlightId,
    });
  };

  const handleDeleteHighlight = (highlightId: number) => {
    setDeletingHighlightId(highlightId);

    removeHighlight.mutate(highlightId, {
      onError: (error) => {
        Alert.alert("Error", "There was an error removing the highlight.");
        console.error("Failed to delete highlight", error);
      },
      onSettled: () => {
        setDeletingHighlightId(null);
      },
    });
  };

  return (
    <ActionSheet
      gestureEnabled
      indicatorStyle={{
        display: "none",
      }}
      containerStyle={{
        backgroundColor: theme["base-200"],
      }}
      safeAreaInsets={insets}
    >
      <View className="px-6 pt-5 pb-3">
        <Text className="font-semibold text-lg text-center text-base-content">
          Notes & Highlights
        </Text>
      </View>

      {isLoading ? (
        <View className="px-6 py-10 items-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={highlights}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 16,
          }}
          style={{
            maxHeight: 460,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View className="py-10">
              <Text className="text-center text-neutral">
                No notes or highlights found for this link.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const colorOption = getHighlightColors(item.color);
            const isDeleting =
              deletingHighlightId === item.id && removeHighlight.isPending;

            return (
              <View
                style={{
                  backgroundColor: theme["base-100"],
                  borderColor: theme["neutral-content"],
                  borderLeftColor: colorOption.borderColor,
                  borderLeftWidth: 3,
                  borderRadius: 14,
                  borderWidth: 1,
                  padding: 14,
                }}
              >
                <View className="flex-row items-start">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="flex-1"
                    onPress={() => handleSelectHighlight(item.id)}
                  >
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: colorOption.backgroundColor,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text className="text-base-content">{item.text}</Text>
                    </View>

                    {item.comment ? (
                      <Text className="text-base-content mt-3">
                        {item.comment}
                      </Text>
                    ) : null}

                    <Text className="text-xs text-neutral mt-3">
                      {formatHighlightDate(item.createdAt)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.75}
                    className="ml-3 mt-1"
                    disabled={removeHighlight.isPending}
                    onPress={() => handleDeleteHighlight(item.id)}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={theme.error} />
                    ) : (
                      <Trash2 size={16} color={theme.error} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <View className="px-6 pb-4">
        <Button onPress={closeSheet} variant="outline">
          <Text className="text-base-content">Close</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
