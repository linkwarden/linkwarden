import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/store/auth";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useUser } from "@linkwarden/router/user";
import { useGetLink } from "@linkwarden/router/links";
import useTmpStore from "@/store/tmp";
import { ArchivedFormat } from "@linkwarden/types/global";
import ReadableFormat, {
  ReadableFormatRef,
} from "@/components/Formats/ReadableFormat";
import ImageFormat from "@/components/Formats/ImageFormat";
import PdfFormat from "@/components/Formats/PdfFormat";
import WebpageFormat from "@/components/Formats/WebpageFormat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SheetManager } from "react-native-actions-sheet";
import { Highlighter, List } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";

export default function LinkScreen() {
  const { auth } = useAuthStore();
  const { id, format } = useLocalSearchParams();
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

  const { data: link, refetch: refetchLink } = useGetLink({
    id: linkId,
    auth,
    enabled: true,
  });

  const { updateTmp } = useTmpStore();

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

  return (
    <View
      className="flex-1"
      style={{ paddingBottom: Platform.OS === "android" ? insets.bottom : 0 }}
    >
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

      {link?.id && isReadableFormat ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            void handleOpenHighlights();
          }}
          style={{
            position: "absolute",
            right: 20,
            bottom: insets.bottom + 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.primary,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Highlighter size={22} color={theme["base-100"]} />
        </TouchableOpacity>
      ) : null}

      {isLoading && (
        <View className="absolute inset-0 flex-1 justify-center items-center bg-base-100 p-5">
          <ActivityIndicator size="large" />
          <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
        </View>
      )}
    </View>
  );
}
