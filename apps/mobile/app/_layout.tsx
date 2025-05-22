import { Stack } from "expo-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { mmkvPersister } from "@/lib/queryPersister";
import { useState } from "react";
import "../styles/global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // never refetch for 24h
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvPersister,
        maxAge: Infinity,
      }}
      onSuccess={() => setIsLoading(false)}
    >
      {!isLoading && (
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* <Stack.Screen name="(tabs)" /> */}
          <Stack.Screen
            name="links/[id]"
            options={{
              headerBackTitle: "Back",
              headerShown: true,
              headerTitle: "",
            }}
          />
          <Stack.Screen name="login" />
          <Stack.Screen name="+not-found" />
        </Stack>
      )}
    </PersistQueryClientProvider>
  );
}
