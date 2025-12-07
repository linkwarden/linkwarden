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
        headerTransparent: Platform.OS === "ios" ? true : false,
        headerShadowVisible: false,
        headerBlurEffect:
          colorScheme === "dark" ? "systemMaterialDark" : "systemMaterial",
        headerTintColor: colorScheme === "dark" ? "white" : "black",
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
    />
  );
}
