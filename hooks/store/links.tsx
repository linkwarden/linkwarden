import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
  LinkRequestQuery,
} from "@/types/global";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { PostLinkSchemaType } from "@/lib/shared/schemaValidation";
import getFormatFromContentType from "@/lib/shared/getFormatFromContentType";
import getLinkTypeFromFormat from "@/lib/shared/getLinkTypeFromFormat";

const useLinks = (params: LinkRequestQuery = {}) => {
  const router = useRouter();

  const queryParamsObject = {
    sort: params.sort ?? Number(window.localStorage.getItem("sortBy")) ?? 0,
    collectionId:
      params.collectionId ??
      (router.pathname === "/collections/[id]" ? router.query.id : undefined),
    tagId:
      params.tagId ??
      (router.pathname === "/tags/[id]" ? router.query.id : undefined),
    pinnedOnly:
      params.pinnedOnly ??
      (router.pathname === "/links/pinned" ? true : undefined),
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
    return data?.pages?.flatMap((page) => page?.links ?? []) ?? [];
  }, [data]);

  const memoizedData = useMemo(() => ({ ...data, ...rest }), [data, rest]);

  return {
    links,
    data: memoizedData,
  };
};

const useFetchLinks = (params: string) => {
  const { status } = useSession();

  return useInfiniteQuery({
    queryKey: ["links", { params }],
    queryFn: async (params) => {
      const response = await fetch(
        "/api/v1/search?cursor=" +
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

const useAddLink = () => {
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

      const response = await fetch("/api/v1/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(link),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data: LinkIncludingShortenedCollectionAndTags[]) => {
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
              nextCursor: oldData?.pages?.[0]?.nextCursor,
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

const useUpdateLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: LinkIncludingShortenedCollectionAndTags) => {
      const response = await fetch(`/api/v1/links/${link.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(link),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useDeleteLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/v1/links/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData?.links) return undefined;
        return {
          ...oldData,
          links: oldData.links.filter((e: any) => e.id !== data.id),
        };
      });

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

      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useGetLink = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      id,
      isPublicRoute = router.pathname.startsWith("/public") ? true : undefined,
    }: {
      id: number;
      isPublicRoute?: boolean;
    }) => {
      const path = isPublicRoute
        ? `/api/v1/public/links/${id}`
        : `/api/v1/links/${id}`;

      const response = await fetch(path);
      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data: LinkIncludingShortenedCollectionAndTags) => {
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData?.links) return undefined;
        return {
          ...oldData,
          links: oldData.links.map((e: any) => (e.id === data.id ? data : e)),
        };
      });

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;

        const newPages = oldData.pages?.map((page: any) => {
          if (!page?.links) {
            return page;
          }

          return {
            ...page,
            links: page.links.map((item: any) =>
              item.id === data.id ? data : item
            ),
          };
        });

        return {
          ...oldData,
          pages: newPages,
        };
      });

      queryClient.setQueriesData(
        { queryKey: ["publicLinks"] },
        (oldData: any) => {
          if (!oldData) return undefined;
          const newPages = oldData.pages?.map((page: any) => {
            if (!page?.links) {
              return page;
            }
            return {
              ...page,
              links: page.links.map((item: any) =>
                item.id === data.id ? data : item
              ),
            };
          });

          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
    },
  });
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
      links: LinkIncludingShortenedCollectionAndTags[];
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
  resetInfiniteQueryPagination,
  useUpdateFile,
};
