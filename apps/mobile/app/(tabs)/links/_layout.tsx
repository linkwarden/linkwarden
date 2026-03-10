import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Platform } from "react-native";

export default function Layout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const isIOS26Plus = Platform.OS === "ios" && Number(Platform.Version) >= 26;

  return (
    <Stack
      screenOptions={{
        headerTitle: "Links",
        headerLargeTitle: true,
        headerTintColor: colorScheme === "dark" ? "white" : "black",
        headerTransparent: Platform.OS === "ios",
        headerShadowVisible: false,
        headerSearchBarOptions: {
          placeholder: "Search Links",
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
        headerLargeTitleStyle: {
          color: rawTheme[colorScheme as ThemeName]["base-content"],
        },
        headerTitleStyle: {
          color: rawTheme[colorScheme as ThemeName]["base-content"],
        },
        headerLargeStyle: {
          backgroundColor:
            Platform.OS === "ios"
              ? "transparent"
              : rawTheme[colorScheme as ThemeName]["base-100"],
        },
        headerStyle: {
          backgroundColor: isIOS26Plus
            ? "transparent"
            : rawTheme[colorScheme as ThemeName]["base-100"],
        },
      }}
    />
  );
}
