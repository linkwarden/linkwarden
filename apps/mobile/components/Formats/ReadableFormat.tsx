import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import useAuthStore from "@/store/auth";
import { useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import RenderHtml from "@linkwarden/react-native-render-html";
import ElementNotSupported from "@/components/ElementNotSupported";
import { decode } from "html-entities";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { CalendarDays, Link } from "lucide-react-native";
import { ArchivedFormat } from "@linkwarden/types";
import { Link as LinkType } from "@linkwarden/prisma/client";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

export default function ReadableFormat({ link, setIsLoading }: Props) {
  const FORMAT = ArchivedFormat.readability;

  const { auth } = useAuthStore();
  const [content, setContent] = useState<string>("");
  const { width } = useWindowDimensions();
  const router = useRouter();
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

  return (
    content && (
      <ScrollView
        className="flex-1 bg-base-100"
        contentContainerClassName="p-4"
        nestedScrollEnabled
      >
        <Text className="text-2xl font-bold mb-2.5 text-base-content">
          {decode(link.name || link.description || link.url || "")}
        </Text>

        <TouchableOpacity
          className="flex-row items-center gap-1 mb-2.5 pr-5"
          onPress={() => router.replace(`/links/${link.id}`)}
        >
          <Link
            size={16}
            color={rawTheme[colorScheme as ThemeName]["neutral"]}
          />
          <Text className="text-base text-neutral flex-1" numberOfLines={1}>
            {link.url}
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-1 mb-2.5">
          <CalendarDays
            size={16}
            color={rawTheme[colorScheme as ThemeName]["neutral"]}
          />
          <Text className="text-base text-neutral">
            {new Date(link?.importDate || link.createdAt).toLocaleString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            )}
          </Text>
        </View>

        <View className="border-t border-neutral-content mt-2.5 mb-5" />

        <RenderHtml
          contentWidth={width}
          source={{ html: content }}
          renderers={{
            table: () => (
              <ElementNotSupported
                onPress={() => router.replace(`/links/${link.id}`)}
              />
            ),
          }}
          onHTMLLoaded={() => setIsLoading(false)}
          tagsStyles={{
            p: { fontSize: 18, lineHeight: 28, marginVertical: 10 },
          }}
          baseStyle={{
            color: rawTheme[colorScheme as ThemeName]["base-content"],
          }}
        />
      </ScrollView>
    )
  );
}
