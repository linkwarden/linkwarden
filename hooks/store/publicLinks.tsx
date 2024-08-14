import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { useMemo } from "react";
import {
  LinkIncludingShortenedCollectionAndTags,
  LinkRequestQuery,
} from "@/types/global";
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
    searchByName: params.searchByName,
    searchByUrl: params.searchByUrl,
    searchByDescription: params.searchByDescription,
    searchByTextContent: params.searchByTextContent,
    searchByTags: params.searchByTags,
  } as LinkRequestQuery;

  const queryString = buildQueryString(queryParamsObject);

  const { data, ...rest } = useFetchLinks(queryString);

  const links = useMemo(() => {
    return data?.pages.reduce((acc, page) => {
      return [...acc, ...page];
    }, []);
  }, [data]);

  return {
    links,
    data: { ...data, ...rest },
  } as {
    links: LinkIncludingShortenedCollectionAndTags[];
    data: UseInfiniteQueryResult<InfiniteData<any, unknown>, Error>;
  };
};

const useFetchLinks = (params: string) => {
  return useInfiniteQuery({
    queryKey: ["links", { params }],
    queryFn: async (params) => {
      const response = await fetch(
        "/api/v1/public/collections/links?cursor=" +
          params.pageParam +
          ((params.queryKey[1] as any).params
            ? "&" + (params.queryKey[1] as any).params
            : "")
      );

      const data = await response.json();

      return data.response;
    },
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPage.at(-1).id;
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
