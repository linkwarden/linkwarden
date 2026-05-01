import React, { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import useAuthStore from "@/store/auth";
import { ArchivedFormat } from "@linkwarden/types/global";
import { Link as LinkType } from "@linkwarden/prisma/client";
import Pdf from "react-native-pdf";
import { loadCacheOrFetch } from "@/lib/cache";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

export default function PdfFormat({ link, setIsLoading }: Props) {
  const FORMAT = ArchivedFormat.pdf;

  const { auth } = useAuthStore();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    loadCacheOrFetch({
      filePath:
        FileSystem.documentDirectory + `archivedData/pdf/link_${link.id}.pdf`,
      setContent,
      fetchContent: async (filePath) => {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${FORMAT}`;

        const result = await FileSystem.downloadAsync(apiUrl, filePath, {
          headers: { Authorization: `Bearer ${auth.session}` },
        });

        return result.uri;
      },
    });
  }, [FORMAT, auth.instance, auth.session, link.id]);

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
