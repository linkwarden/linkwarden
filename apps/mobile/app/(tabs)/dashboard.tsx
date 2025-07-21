import { Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import * as DropdownMenu from "zeego/dropdown-menu";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState } from "react";
// import AddLink from "@/components/Modals/AddLink";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAddLink } from "@linkwarden/router/links";
import useAuthStore from "@/store/auth";

export default function DashboardScreen() {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { auth } = useAuthStore();
  const addLink = useAddLink(auth);
  const [link, setLink] = useState("");

  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <TouchableOpacity>
            <IconSymbol size={20} name="plus" color={""} />
          </TouchableOpacity>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          <DropdownMenu.Item
            key="new-link"
            onSelect={() => actionSheetRef.current?.show()}
          >
            <DropdownMenu.ItemTitle>New Link</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            key="new-collection"
            onSelect={() => alert("Item 2 selected")}
          >
            <DropdownMenu.ItemTitle>New Collection</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            key="upload-file"
            onSelect={() => alert("Item 3 selected")}
          >
            <DropdownMenu.ItemTitle>Upload File</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Text>Dashboard</Text>
      {/* <TouchableOpacity>
        <IconSymbol size={20} name="plus" color={""} />
      </TouchableOpacity> */}
      <ActionSheet ref={actionSheetRef} gestureEnabled>
        <View className="px-8 py-5">
          <Input
            placeholder="e.g. https://example.com"
            className="mb-4"
            value={link}
            onChangeText={setLink}
          />

          <Button
            onPress={() =>
              addLink.mutate(
                { url: link },
                {
                  onSuccess: () => {
                    actionSheetRef.current?.hide();
                    setLink("");
                  },
                  onError: (error) => {
                    console.error("Error adding link:", error);
                  },
                }
              )
            }
            variant="accent"
            className="mb-2"
          >
            Save to Linkwarden
          </Button>

          <Button
            onPress={() => {
              actionSheetRef.current?.hide();
              setLink("");
            }}
            variant="outline"
            className="mb-2"
          >
            Cancel
          </Button>
        </View>
      </ActionSheet>
      {/* <AddLink isVisible={modalOpen} onClose={() => setModalOpen(false)} /> */}
    </SafeAreaView>
  );
}
