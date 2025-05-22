import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { PropsWithChildren } from "react";
import { IconSymbol } from "../ui/IconSymbol";

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
}>;

export default function AddLink({ isVisible, children, onClose }: Props) {
  return (
    <View>
      <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              backgroundColor: "#fff",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: "#000",
                marginBottom: 10,
              }}
            >
              Choose a sticker
            </Text>
            <Pressable onPress={onClose}>
              <IconSymbol name="xmark" color="" size={22} />
            </Pressable>
          </View>
          {children}
        </View>
      </Modal>
    </View>
  );
}
