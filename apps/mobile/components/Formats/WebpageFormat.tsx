import React, { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import NetInfo from "@react-native-community/netinfo";
import getPreservedFormatUrl from "@linkwarden/lib/getPreservedFormatUrl";
import { useConfig } from "@linkwarden/router/config";
import useAuthStore from "@/store/auth";
import { ArchivedFormat } from "@linkwarden/types/global";
import { Link as LinkType } from "@linkwarden/prisma/client";
import WebView from "react-native-webview";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

export default function WebpageFormat({ link, setIsLoading }: Props) {
  const FORMAT = ArchivedFormat.monolith;

  const { auth } = useAuthStore();
  const { data: config, isLoading: isConfigLoading } = useConfig(auth);
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

      if (isConfigLoading) {
        return;
      }

      const net = await NetInfo.fetch();
      if (net.isConnected) {
        try {
          const apiUrl = config?.USER_CONTENT_DOMAIN
            ? await getPreservedFormatUrl({
                tokenEndpoint: `${auth.instance}/api/v1/preserved/token`,
                linkId: link.id,
                format: FORMAT,
                headers: {
                  Authorization: `Bearer ${auth.session}`,
                },
              })
            : `${auth.instance}/api/v1/archives/${link.id}?format=${FORMAT}`;

          const result = await FileSystem.downloadAsync(apiUrl, filePath, {
            ...(config?.USER_CONTENT_DOMAIN
              ? {}
              : {
                  headers: { Authorization: `Bearer ${auth.session}` },
                }),
          });

          setContent(result.uri);
        } catch (e) {
          console.error("Failed to fetch content", e);
        }
      }
    }

    loadCacheOrFetch();
  }, [link, auth.instance, auth.session, config?.USER_CONTENT_DOMAIN, isConfigLoading]);

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
        originWhitelist={[...(auth.instance ? [auth.instance] : []), "file://"]}
        javaScriptEnabled={false}
        allowFileAccess={true}
        onLoadEnd={() => setIsLoading(false)}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets
        automaticallyAdjustsScrollIndicatorInsets
      />
    )
  );
}
