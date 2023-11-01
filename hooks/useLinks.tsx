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

    const queryString = buildQueryString(params);

    const response = await fetch(
      `/api/v1/${
        router.asPath === "/dashboard" ? "dashboard" : "links"
      }?${queryString}`
    );

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
