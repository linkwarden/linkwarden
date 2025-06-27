import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@linkwarden/router/user";
import { generateLinkHref } from "@linkwarden/lib/generateLinkHref";
import { useWindowDimensions } from "react-native";
import RenderHtml from "@linkwarden/react-native-render-html";
import ElementNotSupported from "@/components/ElementNotSupported";
import { decode } from "html-entities";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useLinks } from "@linkwarden/router/links";

const CACHE_DIR = FileSystem.documentDirectory + "archivedData/readable/";
const htmlPath = (id: string) => `${CACHE_DIR}link_${id}.html`;

async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export default function LinkScreen() {
  const { auth } = useAuthStore();
  const { id, format } = useLocalSearchParams();
  const { data: user } = useUser(auth);
  const [url, setUrl] = useState<string>();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { links } = useLinks(
    {
      sort: 0,
    },
    auth
  );

  const link = useMemo(() => {
    return links?.find((link) => link.id === Number(id));
  }, [links, id]);

  useEffect(() => {
    async function loadCacheOrFetch() {
      await ensureCacheDir();
      const htmlFile = htmlPath(id as string);

      const [htmlInfo] = await Promise.all([FileSystem.getInfoAsync(htmlFile)]);

      if (format === "3" && htmlInfo.exists) {
        const rawHtml = await FileSystem.readAsStringAsync(htmlFile);
        setHtmlContent(rawHtml);
        setIsLoading(false);
      }

      const net = await NetInfo.fetch();
      if (net.isConnected) {
        await fetchLinkData();
      }
    }

    if (user && user[0]?.id && !url) {
      loadCacheOrFetch();
    }
  }, [user, url]);

  async function fetchLinkData() {
    if (link?.id && format === "3") {
      const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${format}`;
      setUrl(apiUrl);
      try {
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${auth.session}` },
        });
        const html = (await response.json()).content;
        setHtmlContent(html);
        await FileSystem.writeAsStringAsync(htmlPath(id as string), html, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (e) {
        console.error("Failed to fetch HTML content", e);
      } finally {
        setIsLoading(false);
      }
    } else if (link?.id && !format) {
      setUrl(generateLinkHref(link, user[0], auth.instance, true));
    } else if (link?.id && format) {
      setUrl(`${auth.instance}/api/v1/archives/${link.id}?format=${format}`);
    }
  }

  return (
    <>
      {format === "3" && htmlContent ? (
        <ScrollView
          className="flex-1 bg-white"
          contentContainerClassName="p-4"
          nestedScrollEnabled
        >
          <Text className="text-2xl font-bold mb-2.5">
            {decode(link?.name || link?.description || link?.url || "")}
          </Text>

          <TouchableOpacity
            className="flex-row items-center gap-1 mb-2.5 pr-5"
            onPress={() => router.replace(`/links/${id}`)}
          >
            <IconSymbol name="link" size={16} color="gray" />
            <Text className="text-base text-gray-500 flex-1" numberOfLines={1}>
              {link?.url}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-1 mb-2.5">
            <IconSymbol name="calendar" size={16} color="gray" />
            <Text className="text-base text-gray-500">
              {new Date(
                (link?.importDate || link?.createdAt) as string
              ).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          <View className="border-t border-gray-200 mt-2.5 mb-5" />

          <RenderHtml
            contentWidth={width}
            source={{ html: htmlContent }}
            renderers={{
              table: () => (
                <ElementNotSupported
                  onPress={() => router.replace(`/links/${id}`)}
                />
              ),
            }}
            tagsStyles={{
              p: { fontSize: 16, lineHeight: 24, marginVertical: 10 },
            }}
          />
        </ScrollView>
      ) : (
        <View className="flex-1 bg-white">
          {url && (
            <WebView
              className={isLoading ? "opacity-0" : "flex-1"}
              source={{
                uri: url,
                headers: { Authorization: `Bearer ${auth.session}` },
              }}
              onLoadEnd={() => setIsLoading(false)}
            />
          )}
        </View>
      )}

      {isLoading && (
        <View className="absolute inset-0 flex-1 justify-center items-center bg-white p-5">
          <ActivityIndicator size="large" color="gray" />
          <Text className="text-base mt-2.5 text-gray-500">Loading...</Text>
        </View>
      )}
    </>
  );
}
