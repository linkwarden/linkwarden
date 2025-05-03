import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        {/* <Stack.Screen name="(tabs)" /> */}
        <Stack.Screen
          name="links/[id]"
          options={{
            headerBackTitle: "Back",
            headerShown: true,
            gestureEnabled: true,
            headerTitle: "",
          }}
        />
        <Stack.Screen name="login" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </QueryClientProvider>
  );
}
