import { View, Text, Button } from "react-native";

export default function ElementNotSupported({
  message = "This element is currently not supported in this view.",
  buttonTitle = "Open original",
  onPress,
}: {
  message?: string;
  buttonTitle?: string;
  onPress: () => void;
}) {
  return (
    <View className="border-y border-neutral-content my-2 py-5 flex justify-center items-center">
      <Text className="text-neutral">{message}</Text>
      <Button onPress={onPress} title={buttonTitle} />
    </View>
  );
}
