import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  useQuery,
  QueryKey,
} from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
  LinkRequestQuery,
  MobileAuth,
  TagIncludingLinkCount,
} from "@linkwarden/types/global";
import { useSession } from "next-auth/react";
import {
  LinkArchiveActionSchemaType,
  PostLinkSchemaType,
} from "@linkwarden/lib/schemaValidation";
import getFormatFromContentType from "@linkwarden/lib/getFormatFromContentType";
import getLinkTypeFromFormat from "@linkwarden/lib/getLinkTypeFromFormat";
import type toaster from "react-hot-toast";
import { TFunction } from "next-i18next";

const useLinks = (params: LinkRequestQuery = {}, auth?: MobileAuth) => {
  const sort =
    params.sort ??
    (typeof window !== "undefined"
      ? Number(window.localStorage.getItem("sortBy"))
      : 0) ??
    0;

  const queryString = useMemo(() => {
    return buildQueryString({
      sort,
      collectionId: params.collectionId,
      tagId: params.tagId,
      pinnedOnly: params.pinnedOnly ?? undefined,
      searchQueryString: params.searchQueryString,
    });
  }, [
    sort,
    params.collectionId,
    params.tagId,
    params.pinnedOnly,
    params.searchQueryString,
  ]);

  const query = useFetchLinks(queryString, auth);

  const links = useMemo(() => {
    return query.data?.pages?.flatMap((p) => p.links ?? []) ?? [];
  }, [query.dataUpdatedAt]);

  return {
    links,
    data: query,
  };
};

const useFetchLinks = (params: string, auth?: MobileAuth) => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth?.status;
  }

  return useInfiniteQuery({
    queryKey: ["links", { params }],
    queryFn: async (params) => {
      const url =
        (auth?.instance ? auth?.instance : "") +
        "/api/v1/search?cursor=" +
        params.pageParam +
        ((params.queryKey[1] as any).params
          ? "&" + (params.queryKey[1] as any).params
          : "");
      const response = await fetch(
        url,
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      const data = await response.json();

      return {
        links: data.data.links as LinkIncludingShortenedCollectionAndTags[],
        nextCursor: data.data.nextCursor as number | null,
      };
    },
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: status === "authenticated",
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

const extractTagsFromQueryData = (data: unknown): TagIncludingLinkCount[] => {
  if (Array.isArray(data)) return data as TagIncludingLinkCount[];

  if (
    data &&
    typeof data === "object" &&
    "pages" in data &&
    Array.isArray((data as any).pages)
  ) {
    return (data as any).pages.flatMap((page: any) => page?.tags ?? []);
  }

  return [];
};

const mergeTagsFromQueriesData = (queries: [QueryKey, unknown][]) => {
  const tagsById = new Map<number, TagIncludingLinkCount>();

  for (const [, data] of queries ?? []) {
    for (const tag of extractTagsFromQueryData(data)) {
      if (tag.id == null || tagsById.has(tag.id)) continue;
      tagsById.set(tag.id, tag);
    }
  }

  return Array.from(tagsById.values());
};

const upsertLinkInList = (
  links: LinkIncludingShortenedCollectionAndTags[] = [],
  link: LinkIncludingShortenedCollectionAndTags,
  optimisticId?: number
) => {
  const existingIndex = links.findIndex(
    (item) => item.id === optimisticId || item.id === link.id
  );

  if (existingIndex === -1) return [link, ...links];

  const nextLinks = [...links];
  nextLinks[existingIndex] = link;
  return nextLinks;
};

const upsertLinkInInfiniteData = (
  oldData: any,
  link: LinkIncludingShortenedCollectionAndTags,
  optimisticId?: number
) => {
  if (!oldData?.pages?.length) return oldData;

  let replaced = false;
  const pages = oldData.pages.map((page: any) => {
    const links = page?.links?.map((item: any) => {
      if (item.id === optimisticId || item.id === link.id) {
        replaced = true;
        return link;
      }
      return item;
    });

    return { ...page, links };
  });

  if (!replaced) {
    const firstPage = pages[0];
    pages[0] = {
      ...firstPage,
      links: upsertLinkInList(firstPage?.links ?? [], link, optimisticId),
    };
  }

  return { ...oldData, pages };
};

const upsertLinkInDashboardData = (
  oldData: any,
  link: LinkIncludingShortenedCollectionAndTags,
  optimisticId?: number
) => {
  if (!oldData) return oldData;

  const updatedLinks = upsertLinkInList(
    oldData.links ?? [],
    link,
    optimisticId
  ).slice(0, 16);

  const collectionLinks = { ...(oldData.collectionLinks ?? {}) };
  const collectionId = link.collection?.id;

  if (collectionId != null && collectionLinks[collectionId]) {
    collectionLinks[collectionId] = upsertLinkInList(
      collectionLinks[collectionId],
      link,
      optimisticId
    ).slice(0, 16);
  }

  return {
    ...oldData,
    links: updatedLinks,
    collectionLinks,
  };
};

const removeLinkFromInfiniteData = (oldData: any, linkId: number) => {
  if (!oldData?.pages?.length) return oldData;

  return {
    ...oldData,
    pages: oldData.pages.map((page: any) => ({
      ...page,
      links: (page.links ?? []).filter((item: any) => item.id !== linkId),
    })),
  };
};

const removeLinkFromDashboardData = (oldData: any, linkId: number) => {
  if (!oldData) return oldData;

  const removedLink = (oldData.links ?? []).find(
    (item: any) => item.id === linkId
  );
  const numberOfPinnedLinks = removedLink?.pinnedBy?.length
    ? Math.max(0, (oldData.numberOfPinnedLinks ?? 0) - 1)
    : oldData.numberOfPinnedLinks;

  const hasCollectionLinks = oldData.collectionLinks != null;
  const collectionLinks = hasCollectionLinks
    ? { ...oldData.collectionLinks }
    : oldData.collectionLinks;
  if (hasCollectionLinks) {
    for (const [collectionId, links] of Object.entries(collectionLinks)) {
      collectionLinks[Number(collectionId)] = (links as any[]).filter(
        (item: any) => item.id !== linkId
      );
    }
  }

  return {
    ...oldData,
    links: (oldData.links ?? []).filter((item: any) => item.id !== linkId),
    collectionLinks,
    numberOfPinnedLinks,
  };
};

const isLinkPinned = (link?: LinkIncludingShortenedCollectionAndTags) => {
  return Boolean(link?.pinnedBy && link.pinnedBy.length > 0);
};

const findLinkInInfiniteData = (data: any, linkId: number) => {
  if (!data?.pages?.length) return undefined;
  for (const page of data.pages) {
    const match = page?.links?.find((item: any) => item.id === linkId);
    if (match) return match;
  }
  return undefined;
};

const findLinkInQueriesData = (
  queries: [QueryKey, unknown][],
  linkId: number
) => {
  for (const [, data] of queries ?? []) {
    const match = findLinkInInfiniteData(data as any, linkId);
    if (match) return match;
  }
  return undefined;
};

const findLinkInDashboardData = (data: any, linkId: number) => {
  const match = data?.links?.find((item: any) => item.id === linkId);
  if (match) return match;

  const collectionLinks = data?.collectionLinks;
  if (!collectionLinks) return undefined;

  for (const links of Object.values(collectionLinks)) {
    const collectionMatch = (links as any[])?.find(
      (item: any) => item.id === linkId
    );
    if (collectionMatch) return collectionMatch;
  }

  return undefined;
};

const replaceLinkInInfiniteData = (
  oldData: any,
  link: LinkIncludingShortenedCollectionAndTags
) => {
  if (!oldData?.pages?.length) return oldData;

  let updated = false;
  const pages = oldData.pages.map((page: any) => {
    const links = (page.links ?? []).map((item: any) => {
      if (item.id === link.id) {
        updated = true;
        return link;
      }
      return item;
    });
    return { ...page, links };
  });

  if (!updated) return oldData;

  return { ...oldData, pages };
};

const replaceLinkInDashboardData = (
  oldData: any,
  link: LinkIncludingShortenedCollectionAndTags
) => {
  if (!oldData) return oldData;

  let updated = false;
  const links = (oldData.links ?? []).map((item: any) => {
    if (item.id === link.id) {
      updated = true;
      return link;
    }
    return item;
  });

  let collectionLinks = oldData.collectionLinks;
  if (oldData.collectionLinks != null) {
    const nextCollectionLinks = { ...oldData.collectionLinks };
    for (const [collectionId, linksForCollection] of Object.entries(
      nextCollectionLinks
    )) {
      const linkList = linksForCollection as any[];
      if (!Array.isArray(linkList)) continue;
      if (!linkList.some((item) => item.id === link.id)) continue;
      updated = true;
      nextCollectionLinks[Number(collectionId)] = linkList.map((item) =>
        item.id === link.id ? link : item
      );
    }
    collectionLinks = nextCollectionLinks;
  }

  if (!updated) return oldData;

  return {
    ...oldData,
    links,
    collectionLinks,
  };
};

const applyPinnedDelta = (oldData: any, delta: number) => {
  if (!oldData || !delta) return oldData;

  return {
    ...oldData,
    numberOfPinnedLinks: Math.max(
      0,
      (oldData.numberOfPinnedLinks ?? 0) + delta
    ),
  };
};

const useAddLink = ({
  auth,
  Alert,
  toast,
  t,
}: {
  auth?: MobileAuth;
  Alert?: any;
  toast?: typeof toaster;
  t?: TFunction;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: PostLinkSchemaType) => {
      if (link.url || link.type === "url") {
        try {
          new URL(link.url || "");
        } catch (error) {
          throw new Error("invalid_url_guide");
        }
      }

      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + "/api/v1/links",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
          body: JSON.stringify(link),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onMutate: async (link) => {
      await queryClient.cancelQueries({ queryKey: ["links"] });
      await queryClient.cancelQueries({ queryKey: ["dashboardData"] });

      const previousLinks = queryClient.getQueriesData({
        queryKey: ["links"],
      });
      const previousDashboard = queryClient.getQueryData(["dashboardData"]);

      const collections =
        (queryClient.getQueryData(["collections"]) as any[]) ?? [];
      const tags = mergeTagsFromQueriesData(
        queryClient.getQueriesData({
          queryKey: ["tags"],
        })
      );
      const user = queryClient.getQueryData(["user"]) as any;

      const collectionFromId =
        link.collection?.id != null
          ? collections.find(
              (collection) => collection.id === link.collection?.id
            )
          : undefined;
      const collectionFromName =
        !collectionFromId && link.collection?.name
          ? collections.find(
              (collection) => collection.name === link.collection?.name
            )
          : undefined;
      const resolvedCollection = collectionFromId ?? collectionFromName;

      const tempId = -Date.now();
      const tempCollectionId = tempId - 1;
      const collectionId =
        resolvedCollection?.id ?? link.collection?.id ?? tempCollectionId;
      const collectionName =
        resolvedCollection?.name ?? link.collection?.name ?? "Unorganized";

      const resolvedTags =
        link.tags?.map((tag, index) => {
          if (tag.id != null) {
            return (
              tags.find((existing) => existing.id === tag.id) ?? {
                id: tag.id,
                name: tag.name,
              }
            );
          }

          const existingTag = tags.find(
            (existing) => existing.name === tag.name
          );
          return (
            existingTag ?? {
              id: tempId - 2 - index,
              name: tag.name,
            }
          );
        }) ?? [];

      const optimisticLink = {
        id: tempId,
        name: link.name?.trim() || link.url || "",
        url: link.url || "",
        description: link.description || "",
        type: link.type || "url",
        preview: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        collectionId,
        collection:
          resolvedCollection ??
          ({
            id: collectionId,
            name: collectionName,
            ownerId: user?.id ?? 0,
          } as any),
        tags: resolvedTags,
      } as LinkIncludingShortenedCollectionAndTags;

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) =>
        upsertLinkInInfiniteData(oldData, optimisticLink, tempId)
      );

      queryClient.setQueryData(["dashboardData"], (oldData: any) =>
        upsertLinkInDashboardData(oldData, optimisticLink, tempId)
      );

      return {
        previousLinks,
        previousDashboard,
        optimisticId: tempId,
      };
    },
    onError: (error, _variables, context) => {
      if (toast && t) toast.error(t(error.message));
      else if (Alert)
        Alert.alert("Error", "There was an error adding the link.");

      if (!context) return;

      context.previousLinks?.forEach(([queryKey, data]: [unknown, unknown]) => {
        queryClient.setQueryData(queryKey as QueryKey, data);
      });

      queryClient.setQueryData(["dashboardData"], context.previousDashboard);
    },
    onSuccess: (
      data: LinkIncludingShortenedCollectionAndTags,
      _link,
      context
    ) => {
      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) =>
        upsertLinkInInfiniteData(oldData, data, context?.optimisticId)
      );

      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useUpdateLink = ({
  auth,
  Alert,
  toast,
  t,
}: {
  auth?: MobileAuth;
  Alert?: any;
  toast?: typeof toaster;
  t?: TFunction;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: LinkIncludingShortenedCollectionAndTags) => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + `/api/v1/links/${link.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
          body: JSON.stringify(link),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onMutate: async (link) => {
      const linkId = link.id;
      if (linkId == null) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: ["links"] });
      await queryClient.cancelQueries({ queryKey: ["publicLinks"] });
      await queryClient.cancelQueries({ queryKey: ["dashboardData"] });

      const previousLinks = queryClient.getQueriesData({
        queryKey: ["links"],
      });
      const previousPublicLinks = queryClient.getQueriesData({
        queryKey: ["publicLinks"],
      });
      const previousDashboard = queryClient.getQueryData(["dashboardData"]);
      const previousLinkQueries = queryClient.getQueriesData({
        queryKey: ["link", linkId],
      });

      const cachedLink =
        findLinkInQueriesData(previousLinks, linkId) ??
        findLinkInDashboardData(previousDashboard, linkId);
      const collections =
        (queryClient.getQueryData(["collections"]) as any[]) ?? [];
      const nextCollectionId =
        link.collection?.id ?? cachedLink?.collection?.id;
      const resolvedCollection =
        nextCollectionId != null
          ? collections.find((collection) => collection.id === nextCollectionId)
          : undefined;
      const optimisticCollection =
        resolvedCollection ??
        (link.collection?.id &&
        cachedLink?.collection?.id === link.collection.id
          ? { ...cachedLink.collection, ...link.collection }
          : link.collection ?? cachedLink?.collection);

      const previousPinned = isLinkPinned(cachedLink);
      const nextPinned =
        typeof link.pinnedBy === "undefined"
          ? previousPinned
          : isLinkPinned(link);
      const pinnedDelta =
        nextPinned === previousPinned ? 0 : nextPinned ? 1 : -1;

      const optimisticLink = {
        ...(cachedLink ?? {}),
        ...link,
        collection: optimisticCollection,
        collectionId:
          optimisticCollection?.id ??
          link.collection?.id ??
          cachedLink?.collectionId,
        updatedAt: new Date().toISOString(),
      } as LinkIncludingShortenedCollectionAndTags;

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) =>
        replaceLinkInInfiniteData(oldData, optimisticLink)
      );

      queryClient.setQueriesData(
        { queryKey: ["publicLinks"] },
        (oldData: any) => replaceLinkInInfiniteData(oldData, optimisticLink)
      );

      queryClient.setQueriesData(
        { queryKey: ["link", linkId] },
        () => optimisticLink
      );

      queryClient.setQueryData(["dashboardData"], (oldData: any) =>
        applyPinnedDelta(
          replaceLinkInDashboardData(oldData, optimisticLink),
          pinnedDelta
        )
      );

      return {
        previousLinks,
        previousPublicLinks,
        previousDashboard,
        previousLinkQueries,
      };
    },
    onError: (error, _variables, context) => {
      if (toast && t) toast.error(t(error.message));
      else if (Alert)
        Alert.alert("Error", "There was an error updating the link.");

      if (!context) return;

      context.previousLinks?.forEach(([queryKey, data]: [unknown, unknown]) => {
        queryClient.setQueryData(queryKey as QueryKey, data);
      });

      context.previousPublicLinks?.forEach(
        ([queryKey, data]: [unknown, unknown]) => {
          queryClient.setQueryData(queryKey as QueryKey, data);
        }
      );

      context.previousLinkQueries?.forEach(
        ([queryKey, data]: [unknown, unknown]) => {
          queryClient.setQueryData(queryKey as QueryKey, data);
        }
      );

      queryClient.setQueryData(["dashboardData"], context.previousDashboard);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["link", data.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useDeleteLink = ({
  auth,
  Alert,
  toast,
  t,
}: {
  auth?: MobileAuth;
  Alert?: any;
  toast?: typeof toaster;
  t?: TFunction;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + `/api/v1/links/${id}`,
        {
          method: "DELETE",
          headers: {
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["links"] });
      await queryClient.cancelQueries({ queryKey: ["dashboardData"] });
      await queryClient.cancelQueries({ queryKey: ["publicLinks"] });

      const previousLinks = queryClient.getQueriesData({
        queryKey: ["links"],
      });
      const previousPublicLinks = queryClient.getQueriesData({
        queryKey: ["publicLinks"],
      });
      const previousDashboard = queryClient.getQueryData(["dashboardData"]);

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) =>
        removeLinkFromInfiniteData(oldData, id)
      );

      queryClient.setQueriesData(
        { queryKey: ["publicLinks"] },
        (oldData: any) => removeLinkFromInfiniteData(oldData, id)
      );

      queryClient.setQueryData(["dashboardData"], (oldData: any) =>
        removeLinkFromDashboardData(oldData, id)
      );

      return {
        previousLinks,
        previousPublicLinks,
        previousDashboard,
      };
    },
    onError: (error, _variables, context) => {
      if (toast && t) toast.error(t(error.message));
      else if (Alert)
        Alert.alert("Error", "There was an error deleting the link.");

      if (!context) return;

      context.previousLinks?.forEach(([queryKey, data]: [unknown, unknown]) => {
        queryClient.setQueryData(queryKey as QueryKey, data);
      });

      context.previousPublicLinks?.forEach(
        ([queryKey, data]: [unknown, unknown]) => {
          queryClient.setQueryData(queryKey as QueryKey, data);
        }
      );

      queryClient.setQueryData(["dashboardData"], context.previousDashboard);
    },
    onSuccess: (data) => {
      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData?.pages?.[0]) return undefined;

        return {
          pages: oldData.pages.map((page: any) => ({
            links: page.links.filter((item: any) => item.id !== data.id),
            nextCursor: page.nextCursor,
          })),
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

type UseGetLinkParams = {
  id: number;
  isPublicRoute?: boolean;
  auth?: MobileAuth;
  enabled?: boolean;
};

const useGetLink = ({
  id,
  isPublicRoute = false,
  auth,
  enabled = false,
}: UseGetLinkParams) => {
  const queryClient = useQueryClient();

  return useQuery(
    // unique key for this link
    {
      queryKey: ["link", id, isPublicRoute],
      placeholderData: {} as LinkIncludingShortenedCollectionAndTags,
      enabled: id != null && enabled,
      queryFn: async () => {
        const base = auth?.instance ?? "";
        const route = isPublicRoute
          ? `/api/v1/public/links/${id}`
          : `/api/v1/links/${id}`;
        const url = `${base}${route}`;

        const res = await fetch(
          url,
          auth?.session
            ? {
                headers: { Authorization: `Bearer ${auth.session}` },
              }
            : undefined
        );
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.response ?? "Failed to fetch link");
        }

        const data =
          payload.response as LinkIncludingShortenedCollectionAndTags;

        // update dashboardData.links
        queryClient.setQueryData(["dashboardData"], (old: any) => {
          if (!old?.links) return old;
          return {
            ...old,
            links: old.links.map((l: any) => (l.id === data.id ? data : l)),
          };
        });

        // update paginated "links"
        queryClient.setQueriesData({ queryKey: ["links"] }, (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              links: page.links.map((l: any) => (l.id === data.id ? data : l)),
            })),
          };
        });

        // update paginated "publicLinks"
        queryClient.setQueriesData(
          { queryKey: ["publicLinks"] },
          (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                links: page.links.map((l: any) =>
                  l.id === data.id ? data : l
                ),
              })),
            };
          }
        );

        return data;
      },
    }
  );
};

const useBulkDeleteLinks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkIds: number[]) => {
      const response = await fetch("/api/v1/links", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkIds }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return linkIds;
    },
    onSuccess: (data) => {
      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: oldData.pages.map((page: any) => ({
            links: page.links.filter((item: any) => !data.includes(item.id)),
            nextCursor: page.nextCursor,
          })),
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ link, file }: any) => {
      let format = getFormatFromContentType(file?.type);
      let linkType = getLinkTypeFromFormat(format);

      const response = await fetch("/api/v1/links", {
        body: JSON.stringify({
          ...link,
          type: linkType,
          name: link.name ? link.name : file.name,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      if (response.ok) {
        const formBody = new FormData();
        file && formBody.append("file", file);

        await fetch(
          `/api/v1/archives/${(data as any).response.id}?format=${format}`,
          {
            body: formBody,
            method: "POST",
          }
        );
      }

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData?.links) return undefined;
        return {
          ...oldData,
          links: [data, ...oldData?.links],
        };
      });

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [
            {
              links: [data, ...oldData?.pages?.[0]?.links],
              nextCursor: oldData?.pages?.[0].nextCursor,
            },
            ...oldData?.pages?.slice(1),
          ],
          pageParams: oldData?.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useUpdateFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      linkId,
      file,
      isPreview,
    }: {
      linkId: number;
      file: File;
      isPreview?: boolean;
    }) => {
      const formBody = new FormData();

      let format = getFormatFromContentType(file?.type);

      if (isPreview) format = ArchivedFormat.jpeg;

      if (!linkId || !file)
        throw new Error("Error generating preview: Invalid parameters");

      formBody.append("file", file);

      const res = await fetch(
        `/api/v1/archives/${linkId}?format=` +
          format +
          (isPreview ? "&preview=true" : ""),
        {
          body: formBody,
          method: "POST",
        }
      );

      const data = res.json();

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useBulkEditLinks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      links,
      newData,
      removePreviousTags,
    }: {
      links: Pick<LinkIncludingShortenedCollectionAndTags, "id">[];
      newData: Pick<
        LinkIncludingShortenedCollectionAndTags,
        "tags" | "collectionId"
      >;
      removePreviousTags: boolean;
    }) => {
      const response = await fetch("/api/v1/links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ links, newData, removePreviousTags }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useArchiveAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LinkArchiveActionSchemaType) => {
      const response = await fetch("/api/v1/links/archive", {
        body: JSON.stringify({
          linkIds: payload.linkIds,
        }),
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

const resetInfiniteQueryPagination = async (
  queryClient: any,
  queryKey: any
) => {
  queryClient.setQueriesData({ queryKey }, (oldData: any) => {
    if (!oldData) return undefined;

    return {
      pages: oldData.pages.slice(0, 1),
      pageParams: oldData.pageParams.slice(0, 1),
    };
  });

  await queryClient.invalidateQueries(queryKey);
};

const useGenerateQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: number) => {
      const response = await fetch(`/api/v1/links/${linkId}/qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response as LinkIncludingShortenedCollectionAndTags;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

const useDeleteQRCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: number) => {
      const response = await fetch(`/api/v1/links/${linkId}/qr`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response as LinkIncludingShortenedCollectionAndTags;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

export {
  useLinks,
  useAddLink,
  useUpdateLink,
  useDeleteLink,
  useBulkDeleteLinks,
  useUploadFile,
  useGetLink,
  useBulkEditLinks,
  useArchiveAction,
  resetInfiniteQueryPagination,
  useUpdateFile,
  useGenerateQRCode,
  useDeleteQRCode,
};
