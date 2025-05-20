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
          style={{ flex: 1, backgroundColor: "#fff" }}
          contentContainerStyle={{ padding: 16 }}
          nestedScrollEnabled
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
            {decode(link?.name || link?.description || link?.url || "")}
          </Text>
          <TouchableOpacity
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              marginBottom: 10,
            }}
            onPress={() => router.replace(`/links/${id}`)}
          >
            <IconSymbol name="link" size={16} color="gray" />
            <Text
              style={{ fontSize: 16, color: "gray", paddingRight: 20 }}
              numberOfLines={1}
            >
              {link?.url}
            </Text>
          </TouchableOpacity>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              marginBottom: 10,
            }}
          >
            <IconSymbol name="calendar" size={16} color="gray" />
            <Text style={{ fontSize: 16, color: "gray" }}>
              {new Date(
                (link?.importDate || link?.createdAt) as string
              ).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          <View
            style={{
              borderTopColor: "#eee",
              borderTopWidth: 1,
              marginTop: 10,
              marginBottom: 20,
            }}
          />

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
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          {url && (
            <WebView
              style={{ ...(isLoading ? { opacity: 0 } : { flex: 1 }) }}
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
        <View
          style={{
            flex: 1,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: 20,
          }}
        >
          <ActivityIndicator size="large" color="gray" />
          <Text style={{ fontSize: 16, marginTop: 10, color: "gray" }}>
            Loading...
          </Text>
        </View>
      )}
    </>
  );
}
