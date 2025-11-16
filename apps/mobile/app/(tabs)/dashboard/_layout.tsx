import { rawTheme, ThemeName } from "@/lib/colors";
import { Stack, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Platform, TouchableOpacity } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import * as DropdownMenu from "zeego/dropdown-menu";

export default function RootLayout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: Platform.OS === "ios" ? true : false,
        headerShadowVisible: false,
        headerBlurEffect:
          colorScheme === "dark" ? "systemMaterialDark" : "systemMaterial",
        headerTintColor: colorScheme === "dark" ? "white" : "black",
        headerLargeStyle: {
          backgroundColor: rawTheme[colorScheme as ThemeName]["base-100"],
        },
        headerStyle: {
          backgroundColor:
            Platform.OS === "ios"
              ? "transparent"
              : colorScheme === "dark"
                ? rawTheme["dark"]["base-100"]
                : "white",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Dashboard",
          headerRight: () => (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity>
                  <Plus
                    size={21}
                    color={rawTheme[colorScheme as ThemeName].primary}
                  />
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
                  onSelect={() => SheetManager.show("new-collection-sheet")}
                >
                  <DropdownMenu.ItemTitle>
                    New Collection
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
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
          headerSearchBarOptions: {
            placeholder: "Search",
            autoCapitalize: "none",
            headerIconColor: colorScheme === "dark" ? "white" : "black",
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
