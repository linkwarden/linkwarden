import {
  Stack,
  usePathname,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { mmkvPersister } from "@/lib/queryPersister";
import { useState, useEffect } from "react";
import "../styles/global.css";
import { SheetProvider } from "react-native-actions-sheet";
import "@/components/ActionSheets/Sheets";
import { useColorScheme } from "nativewind";
import { lightTheme, darkTheme } from "../lib/theme";
import { Platform, View } from "react-native";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useShareIntent } from "expo-share-intent";
import useDataStore from "@/store/data";
import useAuthStore from "@/store/auth";
import { QueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { KeyboardProvider } from "react-native-keyboard-controller";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const { hasShareIntent, shareIntent, error, resetShareIntent } =
    useShareIntent();
  const { updateData, setData, data } = useDataStore();

  const router = useRouter();
  const pathname = usePathname();

  const { auth, setAuth } = useAuthStore();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    setAuth();
    setData();
  }, []);

  useEffect(() => {
    (async () => {
      if (auth.status === "unauthenticated") {
        queryClient.cancelQueries();
        queryClient.clear();
        mmkvPersister.removeClient?.();

        const CACHE_DIR =
          FileSystem.documentDirectory + "archivedData/readable/";
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      }
    })();
  }, [auth.status]);

  useEffect(() => {
    if (!rootNavState?.key) return;

    if (hasShareIntent && shareIntent.webUrl) {
      updateData({
        shareIntent: {
          hasShareIntent: true,
          url: shareIntent.webUrl || "",
        },
      });

      resetShareIntent();
    }

    const needsRewrite =
      ((typeof pathname === "string" && pathname.startsWith("/dataUrl=")) ||
        hasShareIntent) &&
      pathname !== "/incoming";

    if (needsRewrite) {
      router.replace("/incoming");
    }
    if (hasShareIntent) {
      resetShareIntent();
      router.replace("/incoming");
    }
  }, [
    rootNavState?.key,
    hasShareIntent,
    pathname,
    shareIntent?.webUrl,
    data.shareIntent,
  ]);

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
        <KeyboardProvider>
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
                    headerTintColor: colorScheme === "dark" ? "white" : "black",
                    navigationBarColor:
                      rawTheme[colorScheme as ThemeName]["base-100"],
                    headerStyle: {
                      backgroundColor:
                        colorScheme === "dark"
                          ? rawTheme["dark"]["base-100"]
                          : "white",
                    },
                  }}
                />
                <Stack.Screen
                  name="login"
                  options={{
                    navigationBarColor:
                      rawTheme[colorScheme as ThemeName]["base-100"],
                    ...Platform.select({
                      android: {
                        statusBarStyle:
                          colorScheme === "light" ? "light" : "dark",
                        statusBarBackgroundColor:
                          rawTheme[colorScheme as ThemeName]["primary"],
                      },
                    }),
                  }}
                />
                <Stack.Screen
                  name="index"
                  options={{
                    navigationBarColor:
                      rawTheme[colorScheme as ThemeName]["base-100"],
                    ...Platform.select({
                      android: {
                        statusBarStyle:
                          colorScheme === "light" ? "light" : "dark",
                        statusBarBackgroundColor:
                          rawTheme[colorScheme as ThemeName]["primary"],
                      },
                    }),
                  }}
                />
                <Stack.Screen
                  name="incoming"
                  options={{
                    navigationBarColor:
                      rawTheme[colorScheme as ThemeName]["base-100"],
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
            )}
          </SheetProvider>
        </KeyboardProvider>
      </View>
    </PersistQueryClientProvider>
  );
}
