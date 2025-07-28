import { Stack, useRouter } from "expo-router";

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTitle: "Links",
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: "systemUltraThinMaterial",
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
          backgroundColor: "white",
        },
      }}
    />
  );
}
