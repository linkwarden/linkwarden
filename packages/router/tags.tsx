import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import {
  MobileAuth,
  TagIncludingLinkCount,
  PaginatedTags,
} from "@linkwarden/types";
import { useSession } from "next-auth/react";
import { ArchivalTagOption } from "@linkwarden/types/inputSelect";
import {
  MergeTagsSchemaType,
  TagBulkDeletionSchemaType,
} from "@linkwarden/lib/schemaValidation";

type UseTagsOptions = {
  cursor?: number;
  limit?: number;
  paginated?: boolean;
};

// Backward compatible version - returns all tags as array
// Uses same query key as useTagsPaginated but extracts items
const useTags = (
  auth?: MobileAuth,
  options: UseTagsOptions = {}
): UseQueryResult<TagIncludingLinkCount[], Error> => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth?.status;
  }

  const { cursor, limit = 1000 } = options;

  return useQuery({
    queryKey: ["tags-paginated", { cursor, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append("limit", String(limit));
      if (cursor) params.append("cursor", String(cursor));

      const url =
        (auth?.instance ? auth?.instance : "") +
        "/api/v1/tags?" +
        params.toString();

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
      // Return just the items array for backward compatibility
      return data.response.items;
    },
    enabled: status === "authenticated",
  });
};

// New paginated version - returns full paginated response
const useTagsPaginated = (
  auth?: MobileAuth,
  options: UseTagsOptions = {}
): UseQueryResult<PaginatedTags, Error> => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth?.status;
  }

  const { cursor, limit = 50 } = options;

  return useQuery({
    queryKey: ["tags-paginated", { cursor, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.append("limit", String(limit));
      if (cursor) params.append("cursor", String(cursor));

      const url =
        (auth?.instance ? auth?.instance : "") +
        "/api/v1/tags?" +
        params.toString();

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
      return data.response;
    },
    enabled: status === "authenticated",
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

      return data.response;
    },
    onSuccess: () => {
      // Invalidate tags queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["tags-paginated"] });
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

      return data.response;
    },
    onSuccess: () => {
      // Invalidate tags queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["tags-paginated"] });
    },
  });
};

const useRemoveTag = (auth?: MobileAuth) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: number) => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + `/api/v1/tags/${tagId}`,
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
    onSuccess: () => {
      // Invalidate tags queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ["tags-paginated"] });
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
      queryClient.invalidateQueries({ queryKey: ["tags-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
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
      queryClient.invalidateQueries({ queryKey: ["tags-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
};

// Infinite scroll version for tags page - similar to useLinks
const useTagsInfinite = (
  params: { sort?: string; dir?: string; search?: string } = {}
) => {
  const session = useSession();

  const { data, ...rest } = useInfiniteQuery({
    queryKey: ["tags-infinite", params],
    queryFn: async ({ pageParam }) => {
      const queryParams = new URLSearchParams();
      queryParams.append("limit", "50");
      if (pageParam) queryParams.append("cursor", String(pageParam));
      if (params.sort) queryParams.append("sort", params.sort);
      if (params.dir) queryParams.append("dir", params.dir);
      if (params.search) queryParams.append("search", params.search);

      const response = await fetch(`/api/v1/tags?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch tags.");

      const data = await response.json();
      return {
        tags: data.response.items as TagIncludingLinkCount[],
        nextCursor: data.response.nextCursor as number | null,
      };
    },
    initialPageParam: undefined as number | undefined,
    refetchOnWindowFocus: false,
    getNextPageParam: (lastPage) => {
      if (lastPage.nextCursor === null) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    enabled: session.status === "authenticated",
  });

  const tags = useMemo(() => {
    return data?.pages?.flatMap((page) => page?.tags ?? []) ?? [];
  }, [data]);

  return {
    tags,
    data: { ...data, ...rest },
  };
};

export {
  useTags,
  useTagsPaginated,
  useTagsInfinite,
  useUpdateTag,
  useUpsertTags,
  useRemoveTag,
  useBulkTagDeletion,
  useMergeTags,
};
