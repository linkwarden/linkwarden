import { LinkRequestQuery } from "@/types/global";
import { useEffect } from "react";
import useDetectPageBottom from "./useDetectPageBottom";
import { useRouter } from "next/router";
import useLinkStore from "@/store/links";

export default function useLinks(
  {
    sort,
    searchFilter,
    searchQuery,
    pinnedOnly,
    collectionId,
    tagId,
  }: LinkRequestQuery = { sort: 0 }
) {
  const { links, setLinks, resetLinks } = useLinkStore();
  const router = useRouter();

  const { reachedBottom, setReachedBottom } = useDetectPageBottom();

  const getLinks = async (isInitialCall: boolean, cursor?: number) => {
    const requestBody: LinkRequestQuery = {
      cursor,
      sort,
      searchFilter,
      searchQuery,
      pinnedOnly,
      collectionId,
      tagId,
    };

    const encodedData = encodeURIComponent(JSON.stringify(requestBody));

    const response = await fetch(
      `/api/links?body=${encodeURIComponent(encodedData)}`
    );

    const data = await response.json();

    if (response.ok) setLinks(data.response, isInitialCall);
  };

  useEffect(() => {
    resetLinks();

    getLinks(true);
  }, [router, sort, searchFilter]);

  useEffect(() => {
    if (reachedBottom) getLinks(false, links?.at(-1)?.id);

    setReachedBottom(false);
  }, [reachedBottom]);
}
