import { Modal, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SheetHeader from "./ActionSheets/SheetHeader";

type WebViewModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  uri: string;
};

export default function WebViewModal({
  visible,
  onClose,
  title,
  uri,
}: WebViewModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-base-100">
        <SheetHeader
          title={title}
          onClose={onClose}
          titleClassName="text-2xl"
          align="left"
        />
        {visible && <WebView source={{ uri }} className="flex-1" />}
      </View>
    </Modal>
  );
}
