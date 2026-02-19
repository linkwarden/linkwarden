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
import type { Alert as Alert_ } from "react-native";

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

const useAddLink = ({
  auth,
  Alert,
  toast,
  t,
}: {
  auth?: MobileAuth;
  Alert?: typeof Alert_;
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
      const tags = (queryClient.getQueryData(["tags"]) as any[]) ?? [];
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

const useUpdateLink = (auth?: MobileAuth) => {
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

const useDeleteLink = (auth?: MobileAuth) => {
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
};
