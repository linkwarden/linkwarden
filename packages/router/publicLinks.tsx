import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  LinkIncludingShortenedCollectionAndTags,
  LinkRequestQuery,
} from "@linkwarden/types";
import { useRouter } from "next/router";

const usePublicLinks = (params: LinkRequestQuery = {}) => {
  const router = useRouter();

  const queryParamsObject = {
    sort: params.sort ?? Number(window.localStorage.getItem("sortBy")) ?? 0,
    collectionId: params.collectionId ?? router.query.id,
    tagId:
      params.tagId ?? router.pathname === "/tags/[id]"
        ? router.query.id
        : undefined,
    pinnedOnly:
      params.pinnedOnly ?? router.pathname === "/links/pinned"
        ? true
        : undefined,
    searchQueryString: params.searchQueryString,
  } as LinkRequestQuery;

  const queryString = buildQueryString(queryParamsObject);

  const { data, ...rest } = useFetchLinks(queryString);

  const links = useMemo(() => {
    return data?.pages?.flatMap((page) => page?.links ?? []) ?? [];
  }, [data]);

  const memoizedData = useMemo(() => ({ ...data, ...rest }), [data, rest]);

  return {
    links,
    data: memoizedData,
  };
};

const useFetchLinks = (params: string) => {
  return useInfiniteQuery({
    queryKey: ["publicLinks", { params }],
    queryFn: async (params) => {
      const response = await fetch(
        "/api/v1/public/collections/links?cursor=" +
          params.pageParam +
          ((params.queryKey[1] as any).params
            ? "&" + (params.queryKey[1] as any).params
            : "")
      );
      const data = await response.json();

      return {
        links: data.data.links as LinkIncludingShortenedCollectionAndTags[],
        nextCursor: data.data.nextCursor as number | null,
      };
    },
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => {
      if (lastPage.nextCursor === null) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
  });
};

const buildQueryString = (params: LinkRequestQuery) => {
  return Object.keys(params)
    .filter((key) => params[key as keyof LinkRequestQuery] !== undefined)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(
          params[key as keyof LinkRequestQuery] as string
        )}`
    )
    .join("&");
};

export { usePublicLinks };
