import { Stack, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Platform, TouchableOpacity } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import TabBarSafeArea from "@/components/TabBarSafeArea";

export default function Layout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

  return (
    <TabBarSafeArea>
      <Stack
        screenOptions={{
          headerTitle: "Links",
          headerLargeTitle: true,
          headerTintColor: colorScheme === "dark" ? "white" : "black",
          headerTransparent: Platform.OS === "ios",
          headerSearchBarOptions: {
            placeholder: "Search Links",
            autoCapitalize: "none",
            ...(isIOS26Plus && {
              allowToolbarIntegration: false,
              placement: "integratedButton",
              // Without this, iOS 27 drops the large title's padding while searching
              hideNavigationBar: false,
            }),
            onChangeText: (e) => {
              router.setParams({
                search: encodeURIComponent(e.nativeEvent.text),
              });
            },
            headerIconColor: colorScheme === "dark" ? "white" : "black",
          },
          headerShadowVisible: false,
          headerBlurEffect: isIOS26Plus
            ? undefined
            : colorScheme === "dark"
              ? "systemMaterialDark"
              : "systemMaterial",
          headerLargeStyle: {
            backgroundColor: isIOS26Plus
              ? "transparent"
              : rawTheme[colorScheme as ThemeName]["base-100"],
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
            headerRight: () => (
              <TouchableOpacity
                onPress={() => SheetManager.show("add-link-sheet")}
              >
                <Plus
                  size={21}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
    </TabBarSafeArea>
  );
}
