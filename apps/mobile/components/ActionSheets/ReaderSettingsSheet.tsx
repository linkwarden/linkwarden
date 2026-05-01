import { Text, TouchableOpacity, View, ScrollView } from "react-native";
import type { ReactNode } from "react";
import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { ChevronDown, Minus, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import * as DropdownMenu from "zeego/dropdown-menu";
import useReaderStore, {
  READER_BACKGROUND_COLORS,
  READER_DEFAULTS,
  READER_FONT_FAMILIES,
  READER_FONT_SIZES,
  READER_LINE_HEIGHTS,
} from "@/store/reader";
import SheetHeader from "./SheetHeader";

const FONT_LABELS = {
  "sans-serif": "Sans Serif",
  serif: "Serif",
  monospace: "Monospace",
  cursive: "Cursive",
  caveat: "Caveat",
  bentham: "Bentham",
} as const;

const BACKGROUND_LABELS = {
  system: "System",
  light: "Light",
  dark: "Dark",
  sepia: "Sepia",
} as const;

function DropdownRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  const { colorScheme } = useColorScheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-base-100 rounded-lg px-4 py-3 flex-row items-center justify-between"
        >
          <Text className="text-base-content text-base">{label}</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-neutral">{value}</Text>
            <ChevronDown
              size={16}
              color={rawTheme[colorScheme as ThemeName].neutral}
            />
          </View>
        </TouchableOpacity>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>{children}</DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function StepperRow({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View className="bg-base-100 rounded-lg px-4 py-3 flex-row items-center justify-between">
      <Text className="text-base-content text-base">{label}</Text>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          activeOpacity={0.8}
          className="w-9 h-9 rounded-full items-center justify-center bg-base-200"
          onPress={onDecrease}
        >
          <Minus size={16} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-base-content min-w-[64px] text-center">
          {value}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          className="w-9 h-9 rounded-full items-center justify-center bg-base-200"
          onPress={onIncrease}
        >
          <Plus size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function moveInList<T extends string>(
  values: readonly T[],
  currentValue: T,
  direction: -1 | 1
) {
  const currentIndex = values.indexOf(currentValue);
  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= values.length) {
    return currentValue;
  }

  return values[nextIndex];
}

export default function ReaderSettingsSheet(
  props: SheetProps<"reader-settings-sheet">
) {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];
  const { reader, resetReader, updateReader } = useReaderStore();

  const closeSheet = () => {
    void SheetManager.hide(props.sheetId);
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
      <SheetHeader title="Display Settings" onClose={closeSheet} />

      <ScrollView
        style={{
          maxHeight: 540,
        }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 12,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex flex-col gap-5"
      >
        <DropdownRow
          label="Font Style"
          value={
            FONT_LABELS[reader.readableFontFamily as keyof typeof FONT_LABELS]
          }
        >
          {READER_FONT_FAMILIES.map((option) => (
            <DropdownMenu.CheckboxItem
              key={option}
              value={reader.readableFontFamily === option}
              onValueChange={() => {
                if (reader.readableFontFamily === option) return;

                void updateReader({
                  readableFontFamily:
                    option as (typeof READER_FONT_FAMILIES)[number],
                });
              }}
            >
              <DropdownMenu.ItemTitle>
                {FONT_LABELS[option as keyof typeof FONT_LABELS]}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownRow>

        <StepperRow
          label="Font Size"
          value={reader.readableFontSize}
          onDecrease={() =>
            void updateReader({
              readableFontSize: moveInList(
                READER_FONT_SIZES,
                reader.readableFontSize,
                -1
              ),
            })
          }
          onIncrease={() =>
            void updateReader({
              readableFontSize: moveInList(
                READER_FONT_SIZES,
                reader.readableFontSize,
                1
              ),
            })
          }
        />

        <StepperRow
          label="Line Height"
          value={reader.readableLineHeight}
          onDecrease={() =>
            void updateReader({
              readableLineHeight: moveInList(
                READER_LINE_HEIGHTS,
                reader.readableLineHeight,
                -1
              ),
            })
          }
          onIncrease={() =>
            void updateReader({
              readableLineHeight: moveInList(
                READER_LINE_HEIGHTS,
                reader.readableLineHeight,
                1
              ),
            })
          }
        />

        <DropdownRow
          label="Background Color"
          value={
            BACKGROUND_LABELS[
              reader.readableBackgroundColor as keyof typeof BACKGROUND_LABELS
            ]
          }
        >
          {READER_BACKGROUND_COLORS.map((option) => (
            <DropdownMenu.CheckboxItem
              key={option}
              value={reader.readableBackgroundColor === option}
              onValueChange={() => {
                if (reader.readableBackgroundColor === option) return;

                void updateReader({
                  readableBackgroundColor:
                    option as (typeof READER_BACKGROUND_COLORS)[number],
                });
              }}
            >
              <DropdownMenu.ItemTitle>
                {BACKGROUND_LABELS[option as keyof typeof BACKGROUND_LABELS]}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownRow>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <Button
          onPress={() => {
            void resetReader();
          }}
          variant="outline"
          disabled={JSON.stringify(reader) === JSON.stringify(READER_DEFAULTS)}
        >
          <Text className="text-base-content">Reset to Defaults</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
