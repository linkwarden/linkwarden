import {
  router,
  Stack,
  usePathname,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { mmkvPersister } from "@/lib/queryPersister";
import { useState, useEffect } from "react";
import "../styles/global.css";
import { SheetManager, SheetProvider } from "react-native-actions-sheet";
import "@/components/ActionSheets/Sheets";
import { useColorScheme } from "nativewind";
import { lightTheme, darkTheme } from "../lib/theme";
import {
  Alert,
  Linking,
  Platform,
  Share,
  TouchableOpacity,
  View,
} from "react-native";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useShareIntent } from "expo-share-intent";
import useDataStore from "@/store/data";
import useAuthStore from "@/store/auth";
import { QueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { KeyboardProvider } from "react-native-keyboard-controller";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Compass, Ellipsis } from "lucide-react-native";
import { Chromium } from "@/components/ui/Icons";
import useTmpStore from "@/store/tmp";
import {
  LinkIncludingShortenedCollectionAndTags,
  MobileAuth,
} from "@linkwarden/types";
import { useDeleteLink, useUpdateLink } from "@linkwarden/router/links";

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
      <RootComponent isLoading={isLoading} auth={auth} />
    </PersistQueryClientProvider>
  );
}

const RootComponent = ({
  isLoading,
  auth,
}: {
  isLoading: boolean;
  auth: MobileAuth;
}) => {
  const { colorScheme } = useColorScheme();
  const updateLink = useUpdateLink(auth);
  const deleteLink = useDeleteLink(auth);

  const { tmp } = useTmpStore();

  return (
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
                  headerRight: () => (
                    <View className="flex-row gap-5">
                      {tmp.link?.url && (
                        <TouchableOpacity
                          onPress={() =>
                            Linking.openURL(tmp.link?.url as string)
                          }
                        >
                          {Platform.OS === "ios" ? (
                            <Compass
                              size={21}
                              color={
                                rawTheme[colorScheme as ThemeName][
                                  "base-content"
                                ]
                              }
                            />
                          ) : (
                            <Chromium
                              stroke={
                                rawTheme[colorScheme as ThemeName][
                                  "base-content"
                                ]
                              }
                            />
                          )}
                        </TouchableOpacity>
                      )}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          <TouchableOpacity>
                            <Ellipsis
                              size={21}
                              color={
                                rawTheme[colorScheme as ThemeName][
                                  "base-content"
                                ]
                              }
                            />
                          </TouchableOpacity>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content>
                          {tmp.link?.url && (
                            <DropdownMenu.Item
                              key="share"
                              onSelect={async () => {
                                await Share.share({
                                  ...(Platform.OS === "android"
                                    ? { message: tmp.link?.url as string }
                                    : { url: tmp.link?.url as string }),
                                });
                              }}
                            >
                              <DropdownMenu.ItemTitle>
                                Share
                              </DropdownMenu.ItemTitle>
                            </DropdownMenu.Item>
                          )}

                          {tmp.link && tmp.user && (
                            <DropdownMenu.Item
                              key="pin-link"
                              onSelect={async () => {
                                const isAlreadyPinned =
                                  tmp.link?.pinnedBy && tmp.link.pinnedBy[0]
                                    ? true
                                    : false;
                                await updateLink.mutateAsync({
                                  ...(tmp.link as LinkIncludingShortenedCollectionAndTags),
                                  pinnedBy: (isAlreadyPinned
                                    ? [{ id: undefined }]
                                    : [{ id: tmp.user?.id }]) as any,
                                });
                              }}
                            >
                              <DropdownMenu.ItemTitle>
                                {tmp.link.pinnedBy && tmp.link.pinnedBy[0]
                                  ? "Unpin Link"
                                  : "Pin Link"}
                              </DropdownMenu.ItemTitle>
                            </DropdownMenu.Item>
                          )}

                          {tmp.link && (
                            <DropdownMenu.Item
                              key="edit-link"
                              onSelect={() => {
                                SheetManager.show("edit-link-sheet", {
                                  payload: {
                                    link: tmp.link as LinkIncludingShortenedCollectionAndTags,
                                  },
                                });
                              }}
                            >
                              <DropdownMenu.ItemTitle>
                                Edit Link
                              </DropdownMenu.ItemTitle>
                            </DropdownMenu.Item>
                          )}

                          {tmp.link && (
                            <DropdownMenu.Item
                              key="delete-link"
                              onSelect={() => {
                                return Alert.alert(
                                  "Delete Link",
                                  "Are you sure you want to delete this link? This action cannot be undone.",
                                  [
                                    {
                                      text: "Cancel",
                                      style: "cancel",
                                    },
                                    {
                                      text: "Delete",
                                      style: "destructive",
                                      onPress: () => {
                                        deleteLink.mutate(
                                          tmp.link?.id as number
                                        );
                                        // go back
                                        router.back();
                                      },
                                    },
                                  ]
                                );
                              }}
                            >
                              <DropdownMenu.ItemTitle>
                                Delete
                              </DropdownMenu.ItemTitle>
                            </DropdownMenu.Item>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </View>
                  ),
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
  );
};
