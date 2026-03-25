import { Tag } from "@linkwarden/prisma/client";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useRouter } from "next/router";

type TagIncludingCount = Tag & { _count: { links: number } };

const usePublicTags = (): UseQueryResult<TagIncludingCount[]> => {
  const router = useRouter();
  const collectionId = Number(router.query.id);

  return useQuery({
    queryKey: ["publicTags", collectionId],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/public/collections/tags?collectionId=${collectionId}`
      );
      if (!response.ok) throw new Error("Failed to fetch tags.");

      const data = await response.json();
      return data.data.tags;
    },
    enabled: Number.isFinite(collectionId),
  });
};

export { usePublicTags };
