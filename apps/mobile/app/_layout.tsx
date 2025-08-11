import { Stack } from "expo-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { mmkvPersister } from "@/lib/queryPersister";
import { useState } from "react";
import "../styles/global.css";
import { SheetProvider } from "react-native-actions-sheet";
import "@/components/ActionSheets/Sheets";
import { useColorScheme } from "nativewind";
import { lightTheme, darkTheme } from "../lib/theme";
import { Platform, View } from "react-native";
import { rawTheme, ThemeName } from "@/lib/colors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // never refetch for 24h
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvPersister,
        maxAge: Infinity,
        dehydrateOptions: {
          shouldDehydrateMutation: () => true,
          shouldDehydrateQuery: () => true,
        },
      }}
      onSuccess={() => {
        setIsLoading(false);
        queryClient.invalidateQueries();
      }}
    >
      <View
        style={[{ flex: 1 }, colorScheme === "dark" ? darkTheme : lightTheme]}
      >
        <SheetProvider>
          {!isLoading && (
            <Stack
              screenOptions={{
                navigationBarColor:
                  rawTheme[colorScheme as ThemeName]["base-200"],
                headerShown: false,
                contentStyle: {
                  backgroundColor:
                    rawTheme[colorScheme as ThemeName]["base-100"],
                },
                ...Platform.select({
                  android: {
                    statusBarStyle: colorScheme === "dark" ? "light" : "dark",
                    statusBarBackgroundColor:
                      rawTheme[colorScheme as ThemeName]["base-100"],
                  },
                }),
              }}
            >
              {/* <Stack.Screen name="(tabs)" /> */}
              <Stack.Screen
                name="links/[id]"
                options={{
                  headerShown: true,
                  headerBackTitle: "Back",
                  headerTitle: "",
                }}
              />
              <Stack.Screen name="login" />
              <Stack.Screen name="+not-found" />
            </Stack>
          )}
        </SheetProvider>
      </View>
    </PersistQueryClientProvider>
  );
}
