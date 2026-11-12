import {
  Stack,
  usePathname,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryPersister } from "@/lib/queryPersister";
import { useState, useEffect, useRef } from "react";
import "../styles/global.css";
import { SheetProvider } from "react-native-actions-sheet";
import "@/components/ActionSheets/Sheets";
import { useColorScheme } from "nativewind";
import { ThemeProvider } from "expo-router/react-navigation";
import {
  lightTheme,
  darkTheme,
  lightNavigationTheme,
  darkNavigationTheme,
} from "../lib/theme";
import { View } from "react-native";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useShareIntent } from "expo-share-intent";
import useDataStore from "@/store/data";
import useAuthStore from "@/store/auth";
import useReaderStore from "@/store/reader";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { queryClient } from "@/lib/queryClient";
import { StatusBar } from "expo-status-bar";
import OfflineSyncProvider from "@/components/OfflineSyncProvider";
import Analytics from "@/components/Analytics";
import { installCustomHeaders } from "@/lib/customHeaders";

installCustomHeaders();

function extractSharedUrl(
  webUrl?: string | null,
  text?: string | null
): string | null {
  if (webUrl && webUrl.trim()) {
    return webUrl.trim();
  }
  if (text && text.trim()) {
    const match = text.match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : text.trim();
  }
  return null;
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const { updateData, setData, data } = useDataStore();
  const { setReader } = useReaderStore();

  const router = useRouter();
  const pathname = usePathname();

  const { setAuth } = useAuthStore();
  const rootNavState = useRootNavigationState();
  const redirectingToIncoming = useRef(false);

  useEffect(() => {
    setAuth();
    setData();
    setReader();
  }, []);

  // 1. Capture incoming share intent immediately, regardless of cache hydration state
  useEffect(() => {
    if (!hasShareIntent) return;

    const extractedUrl = extractSharedUrl(
      shareIntent?.webUrl,
      shareIntent?.text
    );

    if (extractedUrl) {
      updateData({
        shareIntent: {
          hasShareIntent: true,
          url: extractedUrl,
        },
      });
    }

    resetShareIntent();
  }, [hasShareIntent, shareIntent?.webUrl, shareIntent?.text]);

  // 2. Navigate to /incoming once router and persisted queries are ready
  useEffect(() => {
    if (!rootNavState?.key || isLoading) return;

    const hasPendingShare = Boolean(data?.shareIntent?.hasShareIntent);
    const isDataUrlRoute = typeof pathname === "string" && pathname.startsWith("/dataUrl=");
    let timer: NodeJS.Timeout;

    if ((hasPendingShare || isDataUrlRoute) && pathname !== "/incoming") {
      if (!redirectingToIncoming.current) {
        redirectingToIncoming.current = true;
        router.replace("/incoming");

        timer = setTimeout(() => {
          redirectingToIncoming.current = false;
        }, 1000);
      }
    } else if (pathname === "/incoming" || !hasPendingShare) {
      redirectingToIncoming.current = false;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    rootNavState?.key,
    isLoading,
    pathname,
    data?.shareIntent?.hasShareIntent,
    router,
  ]);
  
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: Infinity,
        dehydrateOptions: {
          shouldDehydrateMutation: () => true,
          shouldDehydrateQuery: (query) => query.state.data !== undefined,
        },
      }}
      onSuccess={() => {
        setIsLoading(false);
        queryClient.invalidateQueries();
      }}
    >
      <RootComponent isLoading={isLoading} />
    </PersistQueryClientProvider>
  );
}

const RootComponent = ({ isLoading }: { isLoading: boolean }) => {
  const { colorScheme } = useColorScheme();

  return (
    <KeyboardProvider>
      <View
        style={[{ flex: 1 }, colorScheme === "dark" ? darkTheme : lightTheme]}
      >
        <SheetProvider>
          <OfflineSyncProvider />
          <Analytics />
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
          {!isLoading && (
            <ThemeProvider
              value={
                colorScheme === "dark"
                  ? darkNavigationTheme
                  : lightNavigationTheme
              }
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor:
                      rawTheme[colorScheme as ThemeName]["base-100"],
                  },
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
                    headerStyle: {
                      backgroundColor:
                        colorScheme === "dark"
                          ? rawTheme["dark"]["base-100"]
                          : "white",
                    },
                  }}
                />
                <Stack.Screen name="index" />
                <Stack.Screen name="subscribe" />
                <Stack.Screen name="incoming" />
                <Stack.Screen name="verify-email" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </ThemeProvider>
          )}
        </SheetProvider>
      </View>
    </KeyboardProvider>
  );
};