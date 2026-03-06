import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Platform } from "react-native";

export default function Layout() {
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerTitle: "Settings",
        headerLargeTitle: true,
        headerTintColor: colorScheme === "dark" ? "white" : "black",
        headerTransparent: Platform.OS === "ios",
        headerShadowVisible: false,
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
        headerBackTitle: "Back",
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
      <Stack.Screen name="index" />
      <Stack.Screen
        name="preferredCollection"
        options={{
          headerTitle: "Preferred Collection",
          headerLargeTitle: false,
        }}
      />
    </Stack>
  );
}
