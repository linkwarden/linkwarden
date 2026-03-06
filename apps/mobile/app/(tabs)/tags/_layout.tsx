import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Platform } from "react-native";

export default function Layout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerTitle: "Tags",
        headerLargeTitle: true,
        headerTintColor: colorScheme === "dark" ? "white" : "black",
        headerTransparent: Platform.OS === "ios",
        headerShadowVisible: false,
        headerSearchBarOptions: {
          placeholder: "Search Tags",
          autoCapitalize: "none",
          onChangeText: (e) => {
            router.setParams({
              search: encodeURIComponent(e.nativeEvent.text),
            });
          },
          headerIconColor: colorScheme === "dark" ? "white" : "black",
        },
        headerLargeTitleStyle: {
          color: rawTheme[colorScheme as ThemeName]["base-content"], // or whatever token you want
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
