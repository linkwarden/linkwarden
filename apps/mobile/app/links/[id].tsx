import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  View,
  ActivityIndicator,
  Text,
  Linking,
  Platform,
  Share,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/store/auth";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useUser } from "@linkwarden/router/user";
import { useDeleteLink, useGetLink, useUpdateLink } from "@linkwarden/router/links";
import useTmpStore from "@/store/tmp";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types/global";
import ReadableFormat, {
  ReadableFormatRef,
} from "@/components/Formats/ReadableFormat";
import ImageFormat from "@/components/Formats/ImageFormat";
import PdfFormat from "@/components/Formats/PdfFormat";
import WebpageFormat from "@/components/Formats/WebpageFormat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SheetManager } from "react-native-actions-sheet";
import { Compass, Ellipsis, Highlighter } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Chromium } from "@/components/ui/Icons";
import * as DropdownMenu from "zeego/dropdown-menu";
import { deleteLinkCache } from "@/lib/cache";
import getOriginalFormat from "@linkwarden/lib/getOriginalFormat";
import { cn } from "@linkwarden/lib/utils";

export default function LinkScreen() {
  const { auth } = useAuthStore();
  const { id, format } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser(auth);
  const linkId = Number(id);
  const archivedFormat = Number(format);
  const isReadableFormat = archivedFormat === ArchivedFormat.readability;
  const [url, setUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const readableFormatRef = useRef<ReadableFormatRef>(null);
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const updateLink = useUpdateLink({ auth, Alert });
  const deleteLink = useDeleteLink({ auth, Alert });
  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

  const { data: link, refetch: refetchLink } = useGetLink({
    id: linkId,
    auth,
    enabled: true,
  });

  const { tmp, updateTmp } = useTmpStore();

  useEffect(() => {
    if (link?.id && user?.id)
      updateTmp({
        link,
        user: {
          id: user.id,
        },
      });

    return () =>
      updateTmp({
        link: null,
      });
  }, [link, user]);

  useEffect(() => {
    if (user?.id && link?.id && format) {
      setUrl(`${auth.instance}/api/v1/archives/${link.id}?format=${format}`);
    } else if (!url) {
      if (link?.url) {
        setUrl(link.url);
      }
    }
  }, [user, link]);

  useFocusEffect(
    useCallback(() => {
      if (!linkId) return;

      void Promise.all([
        refetchLink(),
        queryClient.invalidateQueries({
          queryKey: ["highlights", linkId],
          exact: true,
        }),
      ]);
    }, [linkId, queryClient, refetchLink])
  );

  const insets = useSafeAreaInsets();

  const handleOpenHighlights = useCallback(async () => {
    if (!link?.id || !isReadableFormat) return;

    const highlightId = await SheetManager.show("readable-highlights-sheet", {
      payload: {
        linkId: link.id,
      },
    });

    if (typeof highlightId === "number") {
      readableFormatRef.current?.scrollToHighlight(highlightId);
    }
  }, [isReadableFormat, link?.id]);

  const renderHeaderRight = useCallback(
    () => (
      <View className={cn("flex-row gap-5", isIOS26Plus && "px-2")}>
        <TouchableOpacity
          onPress={() => {
            if (tmp.link) {
              if (tmp.link.url) {
                return Linking.openURL(tmp.link.url);
              } else {
                const originalFormat = getOriginalFormat(tmp.link);

                return Linking.openURL(
                  originalFormat !== null
                    ? auth.instance +
                        `/preserved/${tmp.link.id}?format=${originalFormat}`
                    : tmp.link.url || ""
                );
              }
            }
          }}
        >
          {Platform.OS === "ios" ? (
            <Compass size={21} color={theme["base-content"]} />
          ) : (
            <Chromium stroke={theme["base-content"]} />
          )}
        </TouchableOpacity>
        {isReadableFormat ? (
          <TouchableOpacity
            onPress={() => {
              void handleOpenHighlights();
            }}
          >
            <Highlighter size={21} color={theme["base-content"]} />
          </TouchableOpacity>
        ) : null}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <TouchableOpacity>
              <Ellipsis size={21} color={theme["base-content"]} />
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
                <DropdownMenu.ItemTitle>Share</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            )}

            {tmp.link && tmp.user && (
              <DropdownMenu.Item
                key="pin-link"
                onSelect={() => {
                  const isAlreadyPinned =
                    tmp.link?.pinnedBy && tmp.link.pinnedBy[0] ? true : false;
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
                  void SheetManager.show("edit-link-sheet", {
                    payload: {
                      link: tmp.link as LinkIncludingShortenedCollectionAndTags,
                    },
                  });
                }}
              >
                <DropdownMenu.ItemTitle>Edit Link</DropdownMenu.ItemTitle>
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
                          deleteLink.mutate(tmp.link?.id as number);

                          await deleteLinkCache(tmp.link?.id as number);

                          router.back();
                        },
                      },
                    ]
                  );
                }}
              >
                <DropdownMenu.ItemTitle>Delete</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </View>
    ),
    [
      auth.instance,
      deleteLink,
      handleOpenHighlights,
      isIOS26Plus,
      isReadableFormat,
      router,
      theme,
      tmp.link,
      tmp.user,
      updateLink,
    ]
  );

  return (
    <View
      className="flex-1"
      style={{ paddingBottom: Platform.OS === "android" ? insets.bottom : 0 }}
    >
      <Stack.Screen
        options={{
          headerRight: renderHeaderRight,
        }}
      />

      {link?.id && isReadableFormat ? (
        <ReadableFormat
          ref={readableFormatRef}
          link={link as any}
          setIsLoading={setIsLoading}
        />
      ) : link?.id &&
        (archivedFormat === ArchivedFormat.jpeg ||
          archivedFormat === ArchivedFormat.png) ? (
        <ImageFormat
          link={link as any}
          setIsLoading={setIsLoading}
          format={archivedFormat}
        />
      ) : link?.id && archivedFormat === ArchivedFormat.pdf ? (
        <PdfFormat link={link as any} setIsLoading={setIsLoading} />
      ) : link?.id && archivedFormat === ArchivedFormat.monolith ? (
        <WebpageFormat link={link as any} setIsLoading={setIsLoading} />
      ) : url ? (
        <WebView
          className={isLoading ? "opacity-0" : "flex-1"}
          source={{
            uri: url,
            headers:
              format || link?.type !== "url"
                ? { Authorization: `Bearer ${auth.session}` }
                : {},
          }}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
          onLoadEnd={() => setIsLoading(false)}
        />
      ) : (
        <View className="flex-1 justify-center items-center bg-base-100 p-5">
          <Text className="text-base text-neutral">
            No link data available. Please check your network connection or try
            again later.
          </Text>
        </View>
      )}

      {isLoading && (
        <View className="absolute inset-0 flex-1 justify-center items-center bg-base-100 p-5">
          <ActivityIndicator size="large" />
          <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
        </View>
      )}
    </View>
  );
}
