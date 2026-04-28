import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { cn } from "@linkwarden/lib/utils";
import { rawTheme, ThemeName } from "@/lib/colors";

type SheetHeaderProps = {
  title: string;
  onClose: () => void;
  leftSlot?: ReactNode;
  align?: "center" | "left";
  className?: string;
  titleClassName?: string;
};

export default function SheetHeader({
  title,
  onClose,
  leftSlot,
  align = "center",
  className,
  titleClassName,
}: SheetHeaderProps) {
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];

  return (
    <View
      className={cn(
        "relative min-h-10 justify-center px-8 pt-5 pb-5",
        className
      )}
    >
      {leftSlot ? (
        <View className="absolute left-5 top-0 bottom-0 justify-center z-10">
          {leftSlot}
        </View>
      ) : null}

      <Text
        className={cn(
          "font-semibold text-lg text-base-content",
          align === "center"
            ? "text-center px-12"
            : leftSlot
              ? "text-left pl-12 pr-12"
              : "text-left pr-12",
          titleClassName
        )}
      >
        {title}
      </Text>

      <View className="absolute right-5 top-0 bottom-0 justify-center z-10">
        <TouchableOpacity
          activeOpacity={0.5}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title}`}
          className="h-10 w-10 items-center justify-center rounded-full bg-base-100"
          onPress={onClose}
        >
          <X size={18} color={theme["base-content"]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
