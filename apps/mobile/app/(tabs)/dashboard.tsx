import { Text, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import * as DropdownMenu from "zeego/dropdown-menu";
import { SafeAreaView } from "react-native-safe-area-context";
import { SheetManager } from "react-native-actions-sheet";

export default function DashboardScreen() {
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
            onSelect={() => SheetManager.show("add-link-sheet")}
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
    </SafeAreaView>
  );
}
