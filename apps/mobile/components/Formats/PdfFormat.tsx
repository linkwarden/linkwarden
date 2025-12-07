import React, { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import useAuthStore from "@/store/auth";
import { ArchivedFormat } from "@linkwarden/types";
import { Link as LinkType } from "@linkwarden/prisma/client";
import Pdf from "react-native-pdf";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

export default function PdfFormat({ link, setIsLoading }: Props) {
  const FORMAT = ArchivedFormat.pdf;

  const { auth } = useAuthStore();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    async function loadCacheOrFetch() {
      const filePath =
        FileSystem.documentDirectory + `archivedData/pdf/link_${link.id}.pdf`;

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
      <Pdf
        style={{
          flex: 1,
        }}
        source={{ uri: content }}
        onLoadComplete={() => setIsLoading(false)}
        onPressLink={(uri) => {
          console.log(`Link pressed: ${uri}`);
        }}
      />
    )
  );
}
