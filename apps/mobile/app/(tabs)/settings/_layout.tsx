import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Platform, View } from "react-native";
import TabBarSafeArea from "@/components/TabBarSafeArea";

export default function Layout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

  const themeBackgroundColor = rawTheme[colorScheme as ThemeName]["base-100"];

  return (
    <TabBarSafeArea>
      <Stack
        screenOptions={{
          headerTitle: "Settings",
          headerLargeTitle: true,
          headerTintColor: colorScheme === "dark" ? "white" : "black",
          headerShadowVisible: false,
          ...(isIOS26Plus && {
            // Without this, iOS 27 leaves the back button blank after a search is closed
            headerBackButtonDisplayMode: "minimal",
          }),
          headerBackTitle: "Back",
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
            headerTransparent: Platform.OS === "ios",
          }}
        />
        <Stack.Screen
          name="preferredCollection"
          options={{
            headerTitle: "Preferred Collection",
            headerLargeTitle: false,
            headerTransparent: Platform.OS === "ios",
            headerBlurEffect: isIOS26Plus
              ? undefined
              : colorScheme === "dark"
                ? "systemMaterialDark"
                : "systemMaterial",
            ...(isIOS26Plus
              ? {
                  headerBackground: () => (
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: themeBackgroundColor,
                      }}
                    />
                  ),
                }
              : {}),
            headerSearchBarOptions: {
              placeholder: "Search Collections",
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
          }}
        />
      </Stack>
    </TabBarSafeArea>
  );
}
