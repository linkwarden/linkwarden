import { LinkRequestQuery } from "@/types/global";
import { useEffect } from "react";
import useDetectPageBottom from "./useDetectPageBottom";
import { useRouter } from "next/router";
import useLinkStore from "@/store/links";

export default function useLinks(
  {
    sort,
    collectionId,
    tagId,
    pinnedOnly,
    searchQueryString,
    searchByName,
    searchByUrl,
    searchByDescription,
    searchByTags,
    searchByTextContent,
  }: LinkRequestQuery = { sort: 0 }
) {
  const { links, setLinks, resetLinks } = useLinkStore();
  const router = useRouter();

  const { reachedBottom, setReachedBottom } = useDetectPageBottom();

  const getLinks = async (isInitialCall: boolean, cursor?: number) => {
    const params = {
      sort,
      cursor,
      collectionId,
      tagId,
      pinnedOnly,
      searchQueryString,
      searchByName,
      searchByUrl,
      searchByDescription,
      searchByTags,
      searchByTextContent,
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

    let queryString = buildQueryString(params);

    let basePath;

    if (router.pathname === "/dashboard") basePath = "/api/v1/dashboard";
    else if (router.pathname.startsWith("/public/collections/[id]")) {
      queryString = queryString + "&collectionId=" + router.query.id;
      basePath = "/api/v1/public/collections/links";
    } else basePath = "/api/v1/links";

    const response = await fetch(`${basePath}?${queryString}`);

    const data = await response.json();

    if (response.ok) setLinks(data.response, isInitialCall);
  };

  useEffect(() => {
    resetLinks();

    getLinks(true);
  }, [
    router,
    sort,
    searchQueryString,
    searchByName,
    searchByUrl,
    searchByDescription,
    searchByTextContent,
    searchByTags,
  ]);

  useEffect(() => {
    if (reachedBottom) getLinks(false, links?.at(-1)?.id);

    setReachedBottom(false);
  }, [reachedBottom]);
}
