import { Text, View } from "react-native";
import { IconSymbol } from "./ui/IconSymbol";
import { SFSymbols6_0 } from "sf-symbols-typescript";

export default function DashboardItem({
  name,
  value,
  icon,
}: {
  name: string;
  value: number;
  icon: SFSymbols6_0;
}) {
  return (
    <View className="flex-1 flex-col gap-2 rounded-xl bg-white p-3">
      <View className="flex-row justify-between">
        <View className="flex-col gap-2 items-start">
          <IconSymbol name={icon} size={40} color={"#4169e1"} />
        </View>
        <Text
          className="text-4xl text-primary mt-0.5 text-right max-w-[75%]"
          numberOfLines={1}
        >
          {value || 0}
        </Text>
      </View>
      <Text className="font-semibold text-gray-500">{name}</Text>
    </View>
  );
}
