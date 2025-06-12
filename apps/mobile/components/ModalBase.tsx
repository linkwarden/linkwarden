import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";
import { PropsWithChildren } from "react";
import { IconSymbol } from "./ui/IconSymbol";

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}>;

export default function ModalBase({ isVisible, children, onClose }: Props) {
  return (
    <Modal
      animationType="slide"
      visible={isVisible}
      onRequestClose={onClose}
      transparent={false}
      presentationStyle={Platform.OS === "ios" ? "formSheet" : "overFullScreen"}
    >
      <TouchableOpacity onPress={onClose} className="absolute top-5 right-5">
        <IconSymbol name="xmark" size={16} color="" />
      </TouchableOpacity>
      {/* Overlay */}
      <View className="flex-1 justify-center items-center">
        {/* Modal content */}
        <View className="bg-white rounded-2xl p-8 mx-5 items-center shadow-lg w-full">
          {children}
        </View>
      </View>
    </Modal>
  );
}
