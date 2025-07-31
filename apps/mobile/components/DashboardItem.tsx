import { Text, View } from "react-native";
import { IconSymbol } from "./ui/IconSymbol";
import { SFSymbols6_0 } from "sf-symbols-typescript";

export default function DashboardItem({
  name,
  value,
  icon,
  color,
}: {
  name: string;
  value: number;
  icon: SFSymbols6_0;
  color: string;
}) {
  return (
    <View className="flex-1 flex-col gap-2 rounded-xl bg-base-200 p-3">
      <View className="flex-row justify-between">
        <View className="flex-col gap-2 items-start">
          <IconSymbol name={icon} size={40} color={color} />
        </View>
        <Text
          className="text-4xl text-base-content mt-0.5 text-right max-w-[75%]"
          numberOfLines={1}
        >
          {value || 0}
        </Text>
      </View>
      <Text className="font-semibold text-neutral">{name}</Text>
    </View>
  );
}
