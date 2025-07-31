import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";

export default function RootLayout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerTitle: "Links",
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect:
          colorScheme === "dark" ? "systemMaterialDark" : "systemMaterial",
        headerTintColor: colorScheme === "dark" ? "white" : "black",
        headerSearchBarOptions: {
          placeholder: "Search",
          autoCapitalize: "none",
          onChangeText: (e) => {
            router.setParams({
              search: encodeURIComponent(e.nativeEvent.text),
            });
          },
        },
        headerLargeStyle: {
          backgroundColor: rawTheme[colorScheme as ThemeName]["base-100"],
        },
      }}
    />
  );
}
