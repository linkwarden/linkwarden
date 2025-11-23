import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { WebView } from "react-native-webview";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams } from "expo-router";
import { useUser } from "@linkwarden/router/user";
import { useGetLink } from "@linkwarden/router/links";
import useTmpStore from "@/store/tmp";
import { ArchivedFormat } from "@linkwarden/types";
import ReadableFormat from "@/components/Formats/ReadableFormat";
import ImageFormat from "@/components/Formats/ImageFormat";
import PdfFormat from "@/components/Formats/PdfFormat";
import WebpageFormat from "@/components/Formats/WebpageFormat";

export default function LinkScreen() {
  const { auth } = useAuthStore();
  const { id, format } = useLocalSearchParams();
  const { data: user } = useUser(auth);
  const [url, setUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const { data: link } = useGetLink({ id: Number(id), auth, enabled: true });

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

  return (
    <>
      {link?.id && Number(format) === ArchivedFormat.readability ? (
        <ReadableFormat
          link={link as any}
          setIsLoading={(state) => setIsLoading(state)}
        />
      ) : link?.id &&
        (Number(format) === ArchivedFormat.jpeg ||
          Number(format) === ArchivedFormat.png) ? (
        <ImageFormat
          link={link as any}
          setIsLoading={(state) => setIsLoading(state)}
          format={Number(format)}
        />
      ) : link?.id && Number(format) === ArchivedFormat.pdf ? (
        <PdfFormat
          link={link as any}
          setIsLoading={(state) => setIsLoading(state)}
        />
      ) : link?.id && Number(format) === ArchivedFormat.monolith ? (
        <WebpageFormat
          link={link as any}
          setIsLoading={(state) => setIsLoading(state)}
        />
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
    </>
  );
}
