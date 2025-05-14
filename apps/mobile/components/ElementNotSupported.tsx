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
    <View
      style={{
        borderTopColor: "#eee",
        borderTopWidth: 1,
        borderBottomColor: "#eee",
        borderBottomWidth: 1,
        marginVertical: 10,
        paddingVertical: 20,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>{message}</Text>
      <Button onPress={onPress} title={buttonTitle} />
    </View>
  );
}
