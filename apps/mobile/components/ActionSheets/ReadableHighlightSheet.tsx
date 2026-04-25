import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { Trash2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAuthStore from "@/store/auth";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  usePostHighlight,
  useRemoveHighlight,
} from "@linkwarden/router/highlights";

export const HIGHLIGHT_COLORS = [
  {
    name: "yellow",
    previewColor: "#FDE047",
    backgroundColor: "rgba(234, 179, 8, 0.45)",
    borderColor: "rgba(202, 138, 4, 0.95)",
  },
  {
    name: "red",
    previewColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderColor: "rgba(220, 38, 38, 0.95)",
  },
  {
    name: "blue",
    previewColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    borderColor: "rgba(37, 99, 235, 0.95)",
  },
  {
    name: "green",
    previewColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.3)",
    borderColor: "rgba(22, 163, 74, 0.95)",
  },
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]["name"];

export type ReadableHighlightDraft = {
  highlightId: number | null;
  linkId: number;
  text: string;
  startOffset: number;
  endOffset: number;
  color: HighlightColor;
  comment: string;
};

export const MAX_HIGHLIGHT_TEXT_LENGTH = 2048;

export default function ReadableHighlightSheet(
  props: SheetProps<"readable-highlight-sheet">
) {
  const { auth } = useAuthStore();
  const [draft, setDraft] = useState<ReadableHighlightDraft | null>(null);
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];

  useEffect(() => {
    setDraft(props.payload?.draft ?? null);
  }, [props.payload?.draft]);

  const closeSheet = () => {
    void SheetManager.hide("readable-highlight-sheet");
  };

  const saveHighlight = usePostHighlight(draft?.linkId || 0, auth);
  const deleteHighlight = useRemoveHighlight(draft?.linkId || 0, auth);

  const handleSave = () => {
    if (!draft) return;

    if (!draft.text.trim()) {
      Alert.alert("Highlight", "Please select some text to highlight.");
      return;
    }

    if (draft.text.length > MAX_HIGHLIGHT_TEXT_LENGTH) {
      Alert.alert(
        "Selection too long",
        "Please select a shorter passage before creating a highlight."
      );
      return;
    }

    saveHighlight.mutate(
      {
        color: draft.color,
        comment: draft.comment,
        startOffset: draft.startOffset,
        endOffset: draft.endOffset,
        text: draft.text,
        linkId: draft.linkId,
      },
      {
        onSuccess: () => {
          closeSheet();
        },
        onError: (error) => {
          Alert.alert("Error", "There was an error saving the highlight.");
          console.error("Failed to save highlight", error);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!draft?.highlightId) return;

    deleteHighlight.mutate(draft.highlightId, {
      onSuccess: () => {
        closeSheet();
      },
      onError: (error) => {
        Alert.alert("Error", "There was an error removing the highlight.");
        console.error("Failed to delete highlight", error);
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
      onClose={() => {
        setDraft(null);
      }}
    >
      <View className="px-8 py-5">
        <Text className="font-semibold text-lg mx-auto mb-5 text-base-content">
          Highlight
        </Text>

        <View className="flex-row items-center justify-center gap-4 mb-4">
          {HIGHLIGHT_COLORS.map((colorOption) => {
            const isSelected = draft?.color === colorOption.name;

            return (
              <TouchableOpacity
                key={colorOption.name}
                activeOpacity={0.8}
                onPress={() =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          color: colorOption.name,
                        }
                      : current
                  )
                }
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: colorOption.previewColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected ? (
                  <View
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 999,
                      backgroundColor: theme["base-200"],
                    }}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          multiline
          maxLength={2048}
          textAlignVertical="top"
          placeholder="Notes, Thoughts, etc."
          className="mb-4 h-28 bg-base-100"
          value={draft?.comment ?? ""}
          onChangeText={(text) =>
            setDraft((current) =>
              current
                ? {
                    ...current,
                    comment: text,
                  }
                : current
            )
          }
        />

        <Button
          onPress={handleSave}
          isLoading={saveHighlight.isPending}
          disabled={!draft || deleteHighlight.isPending}
          variant="accent"
          className="mb-2"
        >
          <Text className="text-white">Save</Text>
        </Button>

        {draft?.highlightId ? (
          <Button
            onPress={handleDelete}
            isLoading={deleteHighlight.isPending}
            disabled={saveHighlight.isPending}
            variant="outline"
            className="mb-2"
          >
            <View className="flex-row items-center justify-center gap-2">
              <Trash2 size={16} color={theme["error"]} />
              <Text
                style={{
                  color: theme["error"],
                }}
              >
                Remove Highlight
              </Text>
            </View>
          </Button>
        ) : null}

        <Button onPress={closeSheet} variant="outline" className="mb-2">
          <Text className="text-base-content">Cancel</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
