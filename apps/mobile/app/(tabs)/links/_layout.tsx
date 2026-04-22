import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Platform } from "react-native";

export default function Layout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

  return (
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
          }),
          onChangeText: (e) => {
            router.setParams({
              search: encodeURIComponent(e.nativeEvent.text),
            });
          },
          headerIconColor: colorScheme === "dark" ? "white" : "black",
        },
        headerShadowVisible: false,
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
    />
  );
}
