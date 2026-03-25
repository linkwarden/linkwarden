import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import {
  MobileAuth,
  TagIncludingLinkCount,
  TagRequestQuery,
  TagSort,
} from "@linkwarden/types/global";
import { useSession } from "next-auth/react";
import { ArchivalTagOption } from "@linkwarden/types/inputSelect";
import {
  MergeTagsSchemaType,
  TagBulkDeletionSchemaType,
} from "@linkwarden/lib/schemaValidation";
import { isAtLeastInstanceVersion, useConfig } from "./config";

type TagsPage = {
  tags: TagIncludingLinkCount[];
  nextCursor: number | null;
};

type UseTagsOptions = {
  sort?: TagSort;
  enabled?: boolean;
};

const MIN_TAG_PAGINATION_VERSION = "2.14.0";

const buildQueryString = (params: TagRequestQuery) => {
  return Object.keys(params)
    .filter((key) => params[key as keyof TagRequestQuery] !== undefined)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(
          String(params[key as keyof TagRequestQuery])
        )}`
    )
    .join("&");
};

const getAuthStatus = (auth?: MobileAuth) => {
  if (!auth) {
    const session = useSession();
    return session.status;
  }

  return auth.status;
};

const supportsTagPagination = (version?: string | null) => {
  return isAtLeastInstanceVersion(version, MIN_TAG_PAGINATION_VERSION);
};

const sortTags = (tags: TagIncludingLinkCount[], sort?: TagSort) => {
  const nextTags = [...tags];

  return nextTags.sort((a, b) => {
    switch (sort) {
      case TagSort.DateOldestFirst:
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case TagSort.NameAZ:
        return a.name.localeCompare(b.name);
      case TagSort.NameZA:
        return b.name.localeCompare(a.name);
      case TagSort.LinkCountHighLow:
        return (b._count?.links ?? 0) - (a._count?.links ?? 0);
      case TagSort.LinkCountLowHigh:
        return (a._count?.links ?? 0) - (b._count?.links ?? 0);
      case TagSort.DateNewestFirst:
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });
};

const extractTagsPayload = (data: any): TagsPage => {
  if (Array.isArray(data?.response)) {
    return {
      tags: data.response as TagIncludingLinkCount[],
      nextCursor: null,
    };
  }

  if (Array.isArray(data?.response?.tags)) {
    return {
      tags: data.response.tags as TagIncludingLinkCount[],
      nextCursor: data.response.nextCursor ?? null,
    };
  }

  if (Array.isArray(data?.data?.tags)) {
    return {
      tags: data.data.tags as TagIncludingLinkCount[],
      nextCursor: data.data.nextCursor ?? null,
    };
  }

  return {
    tags: [],
    nextCursor: null,
  };
};

const flattenTagPages = (
  data?: InfiniteData<TagsPage, number> | TagIncludingLinkCount[] | null
) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.pages?.flatMap((page) => page.tags ?? []) ?? [];
};

const replaceTagInQueryData = (
  oldData: InfiniteData<TagsPage, number> | TagIncludingLinkCount[] | undefined,
  tag: TagIncludingLinkCount
) => {
  if (!oldData) return oldData;

  if (Array.isArray(oldData)) {
    return oldData.map((existing) =>
      existing.id === tag.id ? { ...existing, ...tag } : existing
    );
  }

  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      tags: page.tags.map((existing) =>
        existing.id === tag.id ? { ...existing, ...tag } : existing
      ),
    })),
  };
};

const removeTagFromQueryData = (
  oldData: InfiniteData<TagsPage, number> | TagIncludingLinkCount[] | undefined,
  tagId: number
) => {
  if (!oldData) return oldData;

  if (Array.isArray(oldData)) {
    return oldData.filter((tag) => tag.id !== tagId);
  }

  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      tags: page.tags.filter((tag) => tag.id !== tagId),
    })),
  };
};

const useTags = (auth?: MobileAuth, options: UseTagsOptions = {}) => {
  const status = getAuthStatus(auth);
  const config = useConfig(auth);

  const params = useMemo(
    () =>
      buildQueryString({
        sort: options.sort,
      }),
    [options.sort]
  );

  const shouldUsePaginatedSchema = supportsTagPagination(
    config.data?.INSTANCE_VERSION
  );

  const query = useInfiniteQuery({
    queryKey: [
      "tags",
      { params, shouldUsePaginatedSchema, auth: auth?.instance },
    ],
    queryFn: async ({ pageParam, queryKey }) => {
      const supportsPagination = (queryKey[1] as any).shouldUsePaginatedSchema;
      const url =
        (auth?.instance ? auth.instance : "") +
        "/api/v1/tags" +
        (supportsPagination
          ? `?cursor=${pageParam}${
              (queryKey[1] as any).params
                ? "&" + (queryKey[1] as any).params
                : ""
            }`
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

      if (!response.ok) throw new Error("Failed to fetch tags.");

      const data = await response.json();
      const payload = extractTagsPayload(data);

      return {
        tags: supportsPagination
          ? payload.tags
          : sortTags(payload.tags, options.sort),
        nextCursor: supportsPagination ? payload.nextCursor : null,
      };
    },
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled:
      options.enabled !== false &&
      status === "authenticated" &&
      (config.isSuccess || config.isError),
  });

  const tags = useMemo(
    () => flattenTagPages(query.data as InfiniteData<TagsPage, number>),
    [query.data]
  );

  return {
    ...query,
    data: tags,
    isLoading: config.isLoading || query.isLoading,
  };
};

const useTag = (tagId?: number, auth?: MobileAuth) => {
  const status = getAuthStatus(auth);
  const config = useConfig(auth);

  return useQuery({
    queryKey: ["tag", tagId, auth?.instance ?? "web"],
    queryFn: async () => {
      const shouldUsePaginatedSchema = supportsTagPagination(
        config.data?.INSTANCE_VERSION
      );

      const response = await fetch(
        (auth?.instance ? auth.instance : "") +
          (shouldUsePaginatedSchema ? `/api/v1/tags/${tagId}` : "/api/v1/tags"),
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      if (shouldUsePaginatedSchema) {
        return data.response as TagIncludingLinkCount;
      }

      const legacyTag = extractTagsPayload(data).tags.find(
        (tag) => tag.id === tagId
      );

      if (!legacyTag) throw new Error("Tag not found.");

      return legacyTag;
    },
    enabled:
      status === "authenticated" &&
      !!tagId &&
      (config.isSuccess || config.isError),
  });
};

const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: TagIncludingLinkCount) => {
      const response = await fetch(`/api/v1/tags/${tag.id}`, {
        body: JSON.stringify(tag),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response as TagIncludingLinkCount;
    },
    onSuccess: (data) => {
      queryClient.setQueriesData({ queryKey: ["tags"] }, (oldData: any) =>
        replaceTagInQueryData(oldData, data)
      );
      queryClient.setQueriesData({ queryKey: ["tag", data.id] }, () => data);
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

const useUpsertTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: ArchivalTagOption[]) => {
      const response = await fetch("/api/v1/tags", {
        body: JSON.stringify({ tags }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response as TagIncludingLinkCount[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

const useRemoveTag = (auth?: MobileAuth) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: number) => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") + `/api/v1/tags/${tagId}`,
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
    onSuccess: (_data, tagId) => {
      queryClient.setQueriesData({ queryKey: ["tags"] }, (oldData: any) =>
        removeTagFromQueryData(oldData, tagId)
      );
      queryClient.removeQueries({ queryKey: ["tag", tagId] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

const useBulkTagDeletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: TagBulkDeletionSchemaType) => {
      const response = await fetch(`/api/v1/tags`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.response);

      return responseData.response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tag"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

const useMergeTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: MergeTagsSchemaType) => {
      const response = await fetch(`/api/v1/tags/merge`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.response);

      return responseData.response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tag"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

export {
  useTag,
  useTags,
  useUpdateTag,
  useUpsertTags,
  useRemoveTag,
  useBulkTagDeletion,
  useMergeTags,
  flattenTagPages,
};
