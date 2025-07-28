import { IconSymbol } from "@/components/ui/IconSymbol";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import * as DropdownMenu from "zeego/dropdown-menu";

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: "systemUltraThinMaterial",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Dashboard",
          headerLargeStyle: {
            backgroundColor: "#f2f2f2",
          },
          headerRight: () => (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity>
                  <IconSymbol size={20} name="plus" color={"#3478f6"} />
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
                  <DropdownMenu.ItemTitle>
                    New Collection
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                {/* <DropdownMenu.Item
                key="upload-file"
                onSelect={() => alert("Item 3 selected")}
              >
                <DropdownMenu.ItemTitle>Upload File</DropdownMenu.ItemTitle>
              </DropdownMenu.Item> */}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ),
        }}
      />
      <Stack.Screen
        name="[section]"
        options={{
          headerTitle: "Links",
          headerBackTitle: "Back",
          headerLargeStyle: {
            backgroundColor: "white",
          },
          headerSearchBarOptions: {
            placeholder: "Search",
            autoCapitalize: "none",
            onChangeText: (e) => {
              router.setParams({
                search: encodeURIComponent(e.nativeEvent.text),
              });
            },
          },
        }}
      />
    </Stack>
  );
}
