import { Tag } from "@prisma/client";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

type TagIncludingCount = Tag & { _count: { links: number } };

const usePublicTags = (): UseQueryResult<TagIncludingCount[]> => {
  const { status } = useSession();

  const router = useRouter();

  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch(
        "/api/v1/public/collections/tags" +
          "?collectionId=" +
          router.query.id || ""
      );
      if (!response.ok) throw new Error("Failed to fetch tags.");

      const data = await response.json();
      return data.response;
    },
  });
};

export { usePublicTags };
