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
import { KeyboardProvider } from "react-native-keyboard-controller";
import * as DropdownMenu from "zeego/dropdown-menu";
import { Compass, Ellipsis } from "lucide-react-native";
import { Chromium } from "@/components/ui/Icons";
import useTmpStore from "@/store/tmp";
import {
  LinkIncludingShortenedCollectionAndTags,
  MobileAuth,
} from "@linkwarden/types/global";
import { useDeleteLink, useUpdateLink } from "@linkwarden/router/links";
import { deleteLinkCache } from "@/lib/cache";
import { queryClient } from "@/lib/queryClient";
import getOriginalFormat from "@linkwarden/lib/getOriginalFormat";
import { StatusBar } from "expo-status-bar";

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
  const updateLink = useUpdateLink({ auth, Alert });
  const deleteLink = useDeleteLink({ auth, Alert });

  const { tmp } = useTmpStore();

  const isIOS26Plus = Platform.OS === "ios" && Number(Platform.Version) >= 26;

  return (
    <View
      style={[{ flex: 1 }, colorScheme === "dark" ? darkTheme : lightTheme]}
    >
      <KeyboardProvider>
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
                  ...(isIOS26Plus
                    ? {
                        headerTransparent: true,
                        headerLargeStyle: { backgroundColor: "transparent" },
                        headerStyle: { backgroundColor: "transparent" },
                        headerRightBackgroundVisible: true,
                        unstable_headerRightItems: () => [
                          {
                            type: "button",
                            label: "Open",
                            icon: { type: "sfSymbol", name: "safari" },
                            onPress: () => {
                              if (tmp.link) {
                                if (tmp.link.url) {
                                  Linking.openURL(tmp.link.url);
                                } else {
                                  const format = getOriginalFormat(tmp.link);

                                  Linking.openURL(
                                    format !== null
                                      ? `${auth.instance}/preserved/${tmp.link.id}?format=${format}`
                                      : tmp.link.url || ""
                                  );
                                }
                              }
                            },
                            sharesBackground: true,
                          },
                          {
                            type: "menu",
                            label: "More",
                            icon: { type: "sfSymbol", name: "ellipsis.circle" },
                            sharesBackground: true,
                            menu: {
                              items: [
                                ...(tmp.link?.url
                                  ? [
                                      {
                                        type: "action",
                                        label: "Share",
                                        onPress: async () => {
                                          await Share.share({
                                            url: tmp.link!.url as string,
                                          });
                                        },
                                      },
                                    ]
                                  : []),

                                ...(tmp.link && tmp.user
                                  ? [
                                      {
                                        type: "action",
                                        label:
                                          tmp.link.pinnedBy &&
                                          tmp.link.pinnedBy[0]
                                            ? "Unpin Link"
                                            : "Pin Link",
                                        onPress: () => {
                                          const isAlreadyPinned =
                                            !!tmp.link?.pinnedBy?.[0];

                                          updateLink.mutateAsync({
                                            ...(tmp.link as LinkIncludingShortenedCollectionAndTags),
                                            pinnedBy: (isAlreadyPinned
                                              ? [{ id: undefined }]
                                              : [{ id: tmp.user?.id }]) as any,
                                          });
                                        },
                                      },
                                    ]
                                  : []),

                                ...(tmp.link
                                  ? [
                                      {
                                        type: "action" as any,
                                        label: "Edit Link",
                                        onPress: () => {
                                          SheetManager.show("edit-link-sheet", {
                                            payload: {
                                              link: tmp.link as LinkIncludingShortenedCollectionAndTags,
                                            },
                                          });
                                        },
                                      },
                                      {
                                        type: "action" as any,
                                        label: "Delete",
                                        attributes: {
                                          destructive: true,
                                        },
                                        onPress: () => {
                                          Alert.alert(
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
                                                onPress: async () => {
                                                  deleteLink.mutate(
                                                    tmp.link?.id as number
                                                  );
                                                  await deleteLinkCache(
                                                    tmp.link?.id as number
                                                  );
                                                  router.back();
                                                },
                                              },
                                            ]
                                          );
                                        },
                                      },
                                    ]
                                  : []),
                              ],
                            },
                          },
                        ],
                      }
                    : {
                        headerTransparent: Platform.OS === "ios",
                        headerLargeTitleStyle: {
                          color:
                            rawTheme[colorScheme as ThemeName]["base-content"],
                        },
                        headerTitleStyle: {
                          color:
                            rawTheme[colorScheme as ThemeName]["base-content"],
                        },
                        headerLargeStyle: {
                          backgroundColor:
                            Platform.OS === "ios"
                              ? "transparent"
                              : rawTheme[colorScheme as ThemeName]["base-100"],
                        },
                        headerStyle: {
                          backgroundColor:
                            Platform.OS === "ios"
                              ? "transparent"
                              : colorScheme === "dark"
                                ? rawTheme["dark"]["base-100"]
                                : "white",
                        },
                        headerRight: () => (
                          <View className="flex-row gap-5 px-2">
                            <TouchableOpacity
                              onPress={() => {
                                if (tmp.link) {
                                  if (tmp.link.url) {
                                    return Linking.openURL(tmp.link.url);
                                  } else {
                                    const format = getOriginalFormat(tmp.link);

                                    return Linking.openURL(
                                      format !== null
                                        ? auth.instance +
                                            `/preserved/${tmp.link.id}?format=${format}`
                                        : tmp.link.url || ""
                                    );
                                  }
                                }
                              }}
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
                                    onSelect={() => {
                                      const isAlreadyPinned =
                                        tmp.link?.pinnedBy &&
                                        tmp.link.pinnedBy[0]
                                          ? true
                                          : false;
                                      updateLink.mutateAsync({
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
                                            onPress: async () => {
                                              deleteLink.mutate(
                                                tmp.link?.id as number
                                              );

                                              await deleteLinkCache(
                                                tmp.link?.id as number
                                              );

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
                      }),
                }}
              />
              <Stack.Screen name="login" />
              <Stack.Screen name="index" />
              <Stack.Screen name="incoming" />
              <Stack.Screen name="+not-found" />
            </Stack>
          )}
        </SheetProvider>
      </KeyboardProvider>
    </View>
  );
};
