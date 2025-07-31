import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerTitle: "Settings",
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect:
          colorScheme === "dark" ? "systemMaterialDark" : "systemMaterial",
        headerTintColor: colorScheme === "dark" ? "white" : "black",
        headerLargeStyle: {
          backgroundColor: rawTheme[colorScheme as ThemeName]["base-100"],
        },
      }}
    />
  );
}
