import { PropsWithChildren } from "react";
import { IconSymbol } from "../ui/IconSymbol";
import ModalBase from "../ModalBase";
import { Text } from "react-native";

type Props = PropsWithChildren<{
  isVisible: boolean;
  onClose: () => void;
}>;

export default function AddLink({ isVisible, onClose }: Props) {
  return (
    // <ModalBase isVisible={isVisible} onClose={onClose}>
    <Text>Hi</Text>
    // </ModalBase>
  );
}
