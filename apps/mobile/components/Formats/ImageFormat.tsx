import React, { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import useAuthStore from "@/store/auth";
import { ArchivedFormat } from "@linkwarden/types/global";
import { Link as LinkType } from "@linkwarden/prisma/client";
import WebView from "react-native-webview";
import { Image, Platform, ScrollView } from "react-native";
import { loadCacheOrFetch } from "@/lib/cache";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
  format: ArchivedFormat.png | ArchivedFormat.jpeg;
};

export default function ImageFormat({ link, setIsLoading, format }: Props) {
  const FORMAT = format;

  const extension = format === ArchivedFormat.png ? "png" : "jpeg";

  const { auth } = useAuthStore();
  const [content, setContent] = useState<string>("");
  const [dimension, setDimension] = useState<{
    width: number;
    height: number;
  }>();

  useEffect(() => {
    if (content)
      Image.getSize(content, (width, height) => {
        setDimension({ width, height });
      });
  }, [content]);

  useEffect(() => {
    loadCacheOrFetch({
      filePath:
        FileSystem.documentDirectory +
        `archivedData/${extension}/link_${link.id}.${extension}`,
      setContent,
      fetchContent: async (filePath) => {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${FORMAT}`;

        const result = await FileSystem.downloadAsync(apiUrl, filePath, {
          headers: { Authorization: `Bearer ${auth.session}` },
        });

        return result.uri;
      },
    });
  }, [FORMAT, auth.instance, auth.session, extension, link.id]);

  if (Platform.OS === "ios")
    return (
      content &&
      dimension && (
        <ScrollView
          maximumZoomScale={10}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets
          automaticallyAdjustsScrollIndicatorInsets
        >
          <Image
            source={{ uri: content }}
            onLoadEnd={() => setIsLoading(false)}
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: dimension.width / dimension.height,
            }}
            resizeMode="contain"
          />
        </ScrollView>
      )
    );
  else
    return (
      content && (
        <WebView
          style={{
            flex: 1,
          }}
          source={{
            baseUrl: content,
            html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }
                  img {
                    max-width: 100%;
                    height: auto;
                  }
                </style>
              </head>
              <body>
                <img src="${content}" />
              </body>
            </html>
          `,
          }}
          scalesPageToFit
          originWhitelist={[
            ...(auth.instance ? [auth.instance] : []),
            "file://",
          ]}
          javaScriptEnabled={false}
          allowFileAccess={true}
          onLoadEnd={() => setIsLoading(false)}
        />
      )
    );
}
