import { LinkRequestQuery } from "@/types/global";
import { useEffect } from "react";
import useDetectPageBottom from "./useDetectPageBottom";
import { useRouter } from "next/router";
import useLinkStore from "@/store/links";

export default function useLinks({
  sort,
  searchFilter,
  searchQuery,
  pinnedOnly,
  collectionId,
  tagId,
}: Omit<LinkRequestQuery, "cursor"> = {}) {
  const { links, setLinks, resetLinks } = useLinkStore();
  const router = useRouter();

  const hasReachedBottom = useDetectPageBottom();

  const getLinks = async (isInitialCall: boolean, cursor?: number) => {
    const response = await fetch(
      `/api/routes/links?cursor=${cursor}${
        (sort ? "&sort=" + sort : "") +
        (searchQuery && searchFilter
          ? "&searchQuery=" +
            searchQuery +
            "&searchFilter=" +
            searchFilter.name +
            "-" +
            searchFilter.url +
            "-" +
            searchFilter.description +
            "-" +
            searchFilter.collection +
            "-" +
            searchFilter.tags
          : "") +
        (collectionId ? "&collectionId=" + collectionId : "") +
        (tagId ? "&tagId=" + tagId : "") +
        (pinnedOnly ? "&pinnedOnly=" + pinnedOnly : "")
      }`
    );

    const data = await response.json();

    if (response.ok) setLinks(data.response, isInitialCall);
  };

  useEffect(() => {
    resetLinks();

    getLinks(true);
  }, [router, sort, searchFilter]);

  useEffect(() => {
    if (hasReachedBottom) getLinks(false, links?.at(-1)?.id);
  }, [hasReachedBottom]);
}
