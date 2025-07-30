import { Stack, useRouter } from "expo-router";

export default function RootLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTitle: "Settings",
        headerLargeTitle: true,
        headerTransparent: true,
        headerBlurEffect: "systemUltraThinMaterial",
        headerLargeStyle: {
          backgroundColor: "#f2f2f2",
        },
      }}
    />
  );
}
