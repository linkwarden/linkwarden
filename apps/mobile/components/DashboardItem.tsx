import { Text, View } from "react-native";

export default function DashboardItem({
  name,
  value,
  icon,
  color,
}: {
  name: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <View className="flex-1 flex-col gap-2 rounded-xl bg-base-200 p-3">
      <View className="flex-row justify-between">
        <View
          className="flex-col gap-2 rounded-full aspect-square flex justify-center items-center"
          style={{
            backgroundColor: color,
          }}
        >
          {icon}
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
