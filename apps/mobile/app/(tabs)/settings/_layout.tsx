import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Platform, View } from "react-native";

export default function Layout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const isIOS26Plus = Platform.OS === "ios" && Number(Platform.Version) >= 26;

  const themeBackgroundColor = rawTheme[colorScheme as ThemeName]["base-100"];

  return (
    <Stack
      screenOptions={{
        headerTitle: "Settings",
        headerLargeTitle: true,
        headerTintColor: colorScheme === "dark" ? "white" : "black",
        headerShadowVisible: false,
        headerBackTitle: "Back",
        headerBlurEffect:
          colorScheme === "dark" ? "systemMaterialDark" : "systemMaterial",
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
          headerBackground: () => (
            <View
              style={{
                flex: 1,
                backgroundColor: themeBackgroundColor,
              }}
            />
          ),
          headerSearchBarOptions: {
            placeholder: "Search Collections",
            autoCapitalize: "none",
            ...(isIOS26Plus && {
              allowToolbarIntegration: false,
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
  );
}
