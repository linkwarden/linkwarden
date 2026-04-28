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
import { View } from "react-native";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useShareIntent } from "expo-share-intent";
import useDataStore from "@/store/data";
import useAuthStore from "@/store/auth";
import useReaderStore from "@/store/reader";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { queryClient } from "@/lib/queryClient";
import { StatusBar } from "expo-status-bar";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://00d7eed9e810cbbf91a7ed3547e37100@o4510998442475520.ingest.us.sentry.io/4511033679609856",
  sendDefaultPii: false,
  enableLogs: true,
});

export default Sentry.wrap(function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const { updateData, setData, data } = useDataStore();
  const { setReader } = useReaderStore();

  const router = useRouter();
  const pathname = usePathname();

  const { auth, setAuth } = useAuthStore();
  const rootNavState = useRootNavigationState();

  useEffect(() => {
    setAuth();
    setData();
    setReader();
  }, []);

  useEffect(() => {
    if (!rootNavState?.key || isLoading) return;

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
    isLoading,
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
      <RootComponent isLoading={isLoading} />
    </PersistQueryClientProvider>
  );
});

const RootComponent = ({ isLoading }: { isLoading: boolean }) => {
  const { colorScheme } = useColorScheme();

  return (
    <KeyboardProvider>
      <View
        style={[{ flex: 1 }, colorScheme === "dark" ? darkTheme : lightTheme]}
      >
        <SheetProvider>
          <StatusBar
            style={colorScheme === "dark" ? "light" : "dark"}
            backgroundColor={rawTheme[colorScheme as ThemeName]["base-100"]}
          />
          {!isLoading && (
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
              <Stack.Screen name="login" />
              <Stack.Screen name="index" />
              <Stack.Screen name="incoming" />
              <Stack.Screen name="+not-found" />
            </Stack>
          )}
        </SheetProvider>
      </View>
    </KeyboardProvider>
  );
};
