import React, { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import useAuthStore from "@/store/auth";
import { ArchivedFormat } from "@linkwarden/types";
import { Link as LinkType } from "@linkwarden/prisma/client";
import WebView from "react-native-webview";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

export default function WebpageFormat({ link, setIsLoading }: Props) {
  const FORMAT = ArchivedFormat.monolith;

  const { auth } = useAuthStore();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    async function loadCacheOrFetch() {
      const filePath =
        FileSystem.documentDirectory +
        `archivedData/webpage/link_${link.id}.html`;

      await FileSystem.makeDirectoryAsync(
        filePath.substring(0, filePath.lastIndexOf("/")),
        {
          intermediates: true,
        }
      ).catch(() => {});

      const [info] = await Promise.all([FileSystem.getInfoAsync(filePath)]);

      if (info.exists) {
        setContent(filePath);
      }

      const net = await NetInfo.fetch();

      if (net.isConnected) {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${FORMAT}`;

        try {
          const result = await FileSystem.downloadAsync(apiUrl, filePath, {
            headers: { Authorization: `Bearer ${auth.session}` },
          });

          setContent(result.uri);
        } catch (e) {
          console.error("Failed to fetch content", e);
        }
      }
    }

    loadCacheOrFetch();
  }, [link]);

  return (
    content && (
      <WebView
        style={{
          flex: 1,
        }}
        source={{
          uri: content,
          baseUrl: FileSystem.documentDirectory,
        }}
        scalesPageToFit
        originWhitelist={["*"]}
        mixedContentMode="always"
        javaScriptEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        onLoadEnd={() => setIsLoading(false)}
      />
    )
  );
}
