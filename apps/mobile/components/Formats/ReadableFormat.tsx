import React, { useEffect, useMemo, useState } from "react";
import { View, Linking } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import NetInfo from "@react-native-community/netinfo";
import useAuthStore from "@/store/auth";
import WebView from "react-native-webview";
import { decode } from "html-entities";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { ArchivedFormat } from "@linkwarden/types/global";
import { Link as LinkType } from "@linkwarden/prisma/client";
import {
  readerViewCSS,
  readerViewThemeVars,
} from "@linkwarden/lib/readerViewStyles";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

function ReadableSkeleton({ theme }: { theme: (typeof rawTheme)["light"] }) {
  const barStyle = {
    backgroundColor: theme["neutral-content"],
    borderRadius: 6,
    height: 14,
    marginBottom: 10,
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ ...barStyle, height: 22, width: "75%", marginBottom: 14 }} />
      <View style={{ ...barStyle, width: "50%", height: 12 }} />
      <View style={{ ...barStyle, width: "40%", height: 12, marginBottom: 20 }} />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme["neutral-content"],
          marginBottom: 20,
        }}
      />
      <View style={{ ...barStyle, width: "100%" }} />
      <View style={{ ...barStyle, width: "100%" }} />
      <View style={{ ...barStyle, width: "85%" }} />
      <View style={{ ...barStyle, width: "92%" }} />
      <View style={{ ...barStyle, width: "70%" }} />
      <View style={{ ...barStyle, width: "95%" }} />
      <View style={{ ...barStyle, width: "100%" }} />
      <View style={{ ...barStyle, width: "80%" }} />
    </View>
  );
}

export default function ReadableFormat({ link, setIsLoading }: Props) {
  const FORMAT = ArchivedFormat.readability;

  const { auth } = useAuthStore();
  const [content, setContent] = useState<string>("");
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    async function loadCacheOrFetch() {
      const filePath =
        FileSystem.documentDirectory +
        `archivedData/readable/link_${link.id}.html`;

      await FileSystem.makeDirectoryAsync(
        filePath.substring(0, filePath.lastIndexOf("/")),
        {
          intermediates: true,
        }
      ).catch(() => {});

      const [info] = await Promise.all([FileSystem.getInfoAsync(filePath)]);

      if (info.exists) {
        const rawContent = await FileSystem.readAsStringAsync(filePath);
        setContent(rawContent);
      }

      const net = await NetInfo.fetch();

      if (net.isConnected) {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${FORMAT}`;

        try {
          const response = await fetch(apiUrl, {
            headers: { Authorization: `Bearer ${auth.session}` },
          });

          const data = (await response.json()).content;
          setContent(data);
          await FileSystem.writeAsStringAsync(filePath, data, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch (e) {
          console.error("Failed to fetch content", e);
        }
      }
    }

    loadCacheOrFetch();
  }, [link]);

  const theme = rawTheme[colorScheme as ThemeName];
  const isDark = colorScheme === "dark";

  const title = decode(link.name || link.description || link.url || "");
  const dateStr = new Date(link?.importDate || link.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  const htmlDocument = useMemo(
    () => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <style>
        :root { ${readerViewThemeVars(theme, isDark)} }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 16px;
          background-color: ${theme["base-100"]};
          color: ${theme["base-content"]};
          font-family: -apple-system, system-ui, sans-serif;
          -webkit-text-size-adjust: 100%;
        }
        a { color: ${theme.primary}; }
        img { max-width: 100%; height: auto; }
        .rv-header-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          line-height: 1.3;
          overflow-wrap: anywhere;
          word-break: normal;
          hyphens: manual;
        }
        .rv-header-meta {
          font-size: 16px;
          color: ${theme.neutral};
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }
        .rv-header-meta a {
          color: ${theme.neutral};
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .rv-header-separator {
          border: none;
          border-top: 1px solid ${theme["neutral-content"]};
          margin: 10px 0 20px 0;
        }
        ${readerViewCSS}
      </style>
    </head>
    <body>
      <div class="rv-header-title">${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      <div class="rv-header-meta">
        <a href="${(link.url || "").replace(/"/g, "&quot;")}">${link.url || ""}</a>
      </div>
      <div class="rv-header-meta">${dateStr}</div>
      <hr class="rv-header-separator" />
      <div class="reader-view read-only">
        ${content}
      </div>
    </body>
    </html>
  `,
    [content, colorScheme]
  );

  if (!content) {
    return <ReadableSkeleton theme={theme} />;
  }

  return (
    <WebView
      source={{ html: htmlDocument }}
      style={{
        flex: 1,
        backgroundColor: "transparent",
      }}
      onLoadEnd={() => setIsLoading(false)}
      onShouldStartLoadWithRequest={(request) => {
        if (
          request.url === "about:blank" ||
          request.url.startsWith("data:")
        ) {
          return true;
        }
        Linking.openURL(request.url);
        return false;
      }}
      javaScriptEnabled={false}
      originWhitelist={["*"]}
    />
  );
}
