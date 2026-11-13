import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { customHeadersFor } from "@/lib/customHeaders";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import type { NativeStackHeaderItem } from "expo-router/native-stack";
import { useUser } from "@linkwarden/router/user";
import {
  useDeleteLink,
  useGetLink,
  useUpdateLink,
} from "@linkwarden/router/links";
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
import { useSideInsets } from "@/lib/sideInsets";
import useReaderStore, { resolveReaderTheme } from "@/store/reader";
import { SheetManager } from "react-native-actions-sheet";
import { Compass, Ellipsis, Highlighter } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Chromium } from "@/components/ui/Icons";
import * as DropdownMenu from "zeego/dropdown-menu";
import { deleteLinkCache } from "@/lib/cache";
import getOriginalFormat from "@linkwarden/lib/getOriginalFormat";
import getLinkTypeFromFormat from "@linkwarden/lib/getLinkTypeFromFormat";
import { formatAvailable } from "@linkwarden/lib/formatStats";
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

  const linkType = format ? getLinkTypeFromFormat(archivedFormat) : null;
  const formatUnavailable =
    !!linkType && !!link?.id && link[linkType] === "unavailable";
  const formatPending =
    !!linkType &&
    !!link?.id &&
    !formatUnavailable &&
    !formatAvailable(link, linkType);

  useEffect(() => {
    if (formatPending) setIsLoading(true);
  }, [formatPending]);

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

  const archiveUrl =
    user?.id && link?.id && format
      ? `${auth.instance}/api/v1/archives/${link.id}?format=${format}`
      : null;

  useEffect(() => {
    if (archiveUrl) {
      setUrl(archiveUrl);
    } else if (!url) {
      if (link?.url) {
        setUrl(link.url);
      }
    }
  }, [user, link]);

  useFocusEffect(
    useCallback(() => {
      if (!linkId) return;

      Promise.all([
        refetchLink(),
        queryClient.invalidateQueries({
          queryKey: ["highlights", linkId],
          exact: true,
        }),
      ]);
    }, [linkId, queryClient, refetchLink])
  );

  const insets = useSafeAreaInsets();
  const sideInsets = useSideInsets();
  const { reader } = useReaderStore();
  const readerBackground = isReadableFormat
    ? resolveReaderTheme(
        reader.readableBackgroundColor,
        colorScheme === "dark" ? "dark" : "light"
      ).theme["base-100"]
    : undefined;

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

  const openOriginal = useCallback(() => {
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
  }, [auth.instance, tmp.link]);

  const menuActions = useMemo(() => {
    const actions: { key: string; label: string; onSelect: () => void }[] = [];

    if (tmp.link?.url)
      actions.push({
        key: "share",
        label: "Share",
        onSelect: async () => {
          await Share.share({
            ...(Platform.OS === "android"
              ? { message: tmp.link?.url as string }
              : { url: tmp.link?.url as string }),
          });
        },
      });

    if (tmp.link && tmp.user)
      actions.push({
        key: "pin-link",
        label:
          tmp.link.pinnedBy && tmp.link.pinnedBy[0] ? "Unpin Link" : "Pin Link",
        onSelect: () => {
          const isAlreadyPinned =
            tmp.link?.pinnedBy && tmp.link.pinnedBy[0] ? true : false;
          updateLink.mutateAsync({
            ...(tmp.link as LinkIncludingShortenedCollectionAndTags),
            pinnedBy: (isAlreadyPinned
              ? [{ id: undefined }]
              : [{ id: tmp.user?.id }]) as any,
          });
        },
      });

    if (tmp.link && isReadableFormat)
      actions.push({
        key: "display-settings",
        label: "Display Settings",
        onSelect: () => {
          SheetManager.show("reader-settings-sheet");
        },
      });

    if (tmp.link)
      actions.push({
        key: "edit-link",
        label: "Edit Link",
        onSelect: () => {
          SheetManager.show("edit-link-sheet", {
            payload: {
              link: tmp.link as LinkIncludingShortenedCollectionAndTags,
            },
          });
        },
      });

    if (tmp.link?.url)
      actions.push({
        key: "refresh-preserved-formats",
        label: "Refresh All Formats",
        onSelect: () => {
          SheetManager.show("refresh-preserved-formats-sheet", {
            payload: {
              linkId: tmp.link?.id as number,
            },
          });
        },
      });

    if (tmp.link)
      actions.push({
        key: "delete-link",
        label: "Delete",
        onSelect: () => {
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
        },
      });

    return actions;
  }, [deleteLink, isReadableFormat, router, tmp.link, tmp.user, updateLink]);

  const renderHeaderRight = useCallback(
    () => (
      <View className={cn("flex-row gap-5", isIOS26Plus && "px-2")}>
        <TouchableOpacity onPress={openOriginal}>
          {Platform.OS === "ios" ? (
            <Compass size={21} color={theme["base-content"]} />
          ) : (
            <Chromium stroke={theme["base-content"]} />
          )}
        </TouchableOpacity>
        {isReadableFormat ? (
          <TouchableOpacity
            onPress={() => {
              handleOpenHighlights();
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
            {menuActions.map((action) => (
              <DropdownMenu.Item key={action.key} onSelect={action.onSelect}>
                <DropdownMenu.ItemTitle>{action.label}</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </View>
    ),
    [
      handleOpenHighlights,
      isIOS26Plus,
      isReadableFormat,
      menuActions,
      openOriginal,
      theme,
    ]
  );

  // iPhone Duo can stack its bar buttons in a column along the side of the
  // screen. Native items join the back button there, while the custom view
  // above would stay behind at the top.
  const hasSideBar =
    Platform.OS === "ios" &&
    (sideInsets.paddingLeft > 0 || sideInsets.paddingRight > 0);

  // With every button in the side column the bar itself is empty, so the page
  // runs underneath it instead of leaving a blank strip. A PDF would open with
  // its top out of view there, so it keeps the strip.
  const pageRunsUnderHeader =
    hasSideBar && archivedFormat !== ArchivedFormat.pdf;

  const headerRightItems = useCallback(
    (): NativeStackHeaderItem[] => [
      {
        type: "button",
        label: "Open in Browser",
        icon: { type: "sfSymbol", name: "safari" },
        tintColor: theme["base-content"],
        onPress: openOriginal,
      },
      ...(isReadableFormat
        ? [
            {
              type: "button" as const,
              label: "Highlights",
              icon: { type: "sfSymbol" as const, name: "highlighter" as const },
              tintColor: theme["base-content"],
              onPress: () => {
                handleOpenHighlights();
              },
            },
          ]
        : []),
      {
        type: "menu",
        label: "More",
        icon: { type: "sfSymbol", name: "ellipsis" },
        tintColor: theme["base-content"],
        menu: {
          // Without this the menu becomes a single-selection menu, and iOS
          // puts a checkmark next to whichever action was tapped last
          multiselectable: true,
          items: menuActions.map((action) => ({
            type: "action" as const,
            label: action.label,
            onPress: action.onSelect,
          })),
        },
      },
    ],
    [handleOpenHighlights, isReadableFormat, menuActions, openOriginal, theme]
  );

  return (
    <View
      className="flex-1"
      style={{ paddingBottom: Platform.OS === "android" ? insets.bottom : 0 }}
    >
      <Stack.Screen
        options={{
          headerRight: renderHeaderRight,
          unstable_headerRightItems: hasSideBar ? headerRightItems : undefined,
          headerTransparent: pageRunsUnderHeader,
          // Options set here stay until they are set again, so the color from
          // the root layout is repeated for when the bar comes back
          headerStyle: {
            backgroundColor: pageRunsUnderHeader
              ? "transparent"
              : theme["base-100"],
          },
        }}
      />

      {/* The reader's page color also fills the strips beside it, but not the
          one behind Android's navigation buttons, whose color follows the
          app's theme */}
      <View
        className="flex-1"
        style={{ ...sideInsets, backgroundColor: readerBackground }}
      >
        {formatUnavailable ? (
          <View className="flex-1 justify-center items-center bg-base-100 p-5">
            <Text className="text-base text-neutral">
              Format not available...
            </Text>
          </View>
        ) : formatPending ? (
          <View className="flex-1 justify-center items-center bg-base-100 p-5">
            <ActivityIndicator size="large" />
            <Text className="text-base mt-2.5 text-neutral text-center">
              Link preservation is in the queue
            </Text>
            <Text className="text-base text-neutral text-center">
              Please check back later to see the result
            </Text>
          </View>
        ) : link?.id && isReadableFormat ? (
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
              headers: {
                ...customHeadersFor(url),
                // Never send the session to the link's original (external) URL
                ...(url === archiveUrl
                  ? { Authorization: `Bearer ${auth.session}` }
                  : {}),
              },
            }}
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustContentInsets
            automaticallyAdjustsScrollIndicatorInsets
            onLoadEnd={() => setIsLoading(false)}
          />
        ) : (
          <View className="flex-1 justify-center items-center bg-base-100 p-5">
            <Text className="text-base text-neutral">
              No link data available. Please check your network connection or
              try again later.
            </Text>
          </View>
        )}
      </View>

      {isLoading && !formatPending && !formatUnavailable && (
        <View className="absolute inset-0 flex-1 justify-center items-center bg-base-100 p-5">
          <ActivityIndicator size="large" />
          <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
        </View>
      )}
    </View>
  );
}
