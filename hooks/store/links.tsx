import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
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

const useLinks = (params: LinkRequestQuery = {}) => {
  const router = useRouter();

  const queryParamsObject = {
    sort: params.sort ?? Number(window.localStorage.getItem("sortBy")) ?? 0,
    collectionId:
      params.collectionId ?? router.pathname === "/collections/[id]"
        ? router.query.id
        : undefined,
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
  const { status } = useSession();

  return useInfiniteQuery({
    queryKey: ["links", { params }],
    queryFn: async (params) => {
      const response = await fetch(
        "/api/v1/links?cursor=" +
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
    mutationFn: async (link: LinkIncludingShortenedCollectionAndTags) => {
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
    onSuccess: (data) => {
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return [data, ...oldData];
      });

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [[data, ...oldData?.pages[0]], ...oldData?.pages.slice(1)],
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
      // queryClient.setQueryData(["dashboardData"], (oldData: any) => {
      //   if (!oldData) return undefined;
      //   return oldData.map((e: any) => (e.id === data.id ? data : e));
      // });

      // queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
      //   if (!oldData) return undefined;
      //   return {
      //     pages: oldData.pages.map((page: any) =>
      //       page.map((item: any) => (item.id === data.id ? data : item))
      //     ),
      //     pageParams: oldData.pageParams,
      //   };
      // });

      queryClient.invalidateQueries({ queryKey: ["links"] }); // Temporary workaround
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] }); // Temporary workaround

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
        if (!oldData) return undefined;
        return oldData.filter((e: any) => e.id !== data.id);
      });

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: oldData.pages.map((page: any) =>
            page.filter((item: any) => item.id !== data.id)
          ),
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

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/v1/links/${id}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return oldData.map((e: any) => (e.id === data.id ? data : e));
      });

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: oldData.pages.map((page: any) =>
            page.map((item: any) => (item.id === data.id ? data : item))
          ),
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
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
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return oldData.filter((e: any) => !data.includes(e.id));
      });

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: oldData.pages.map((page: any) =>
            page.filter((item: any) => !data.includes(item.id))
          ),
          pageParams: oldData.pageParams,
        };
      });

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
      let fileType: ArchivedFormat | null = null;
      let linkType: "url" | "image" | "pdf" | null = null;

      if (file?.type === "image/jpg" || file.type === "image/jpeg") {
        fileType = ArchivedFormat.jpeg;
        linkType = "image";
      } else if (file.type === "image/png") {
        fileType = ArchivedFormat.png;
        linkType = "image";
      } else if (file.type === "application/pdf") {
        fileType = ArchivedFormat.pdf;
        linkType = "pdf";
      } else {
        return { ok: false, data: "Invalid file type." };
      }

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
          `/api/v1/archives/${(data as any).response.id}?format=${fileType}`,
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
        if (!oldData) return undefined;
        return [data, ...oldData];
      });

      queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [[data, ...oldData?.pages[0]], ...oldData?.pages.slice(1)],
          pageParams: oldData?.pageParams,
        };
      });

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
    onSuccess: (data, { links, newData, removePreviousTags }) => {
      // TODO: Fix these
      // queryClient.setQueryData(["dashboardData"], (oldData: any) => {
      //   if (!oldData) return undefined;
      //   return oldData.map((e: any) =>
      //     data.find((d: any) => d.id === e.id) ? data : e
      //   );
      // });
      // queryClient.setQueriesData({ queryKey: ["links"] }, (oldData: any) => {
      //   if (!oldData) return undefined;
      //   return {
      //     pages: oldData.pages.map((page: any) => for (item of links) {
      //       page.map((item: any) => (item.id === data.id ? data : item))
      //     }
      //     ),
      //     pageParams: oldData.pageParams,
      //   };
      // });
      queryClient.invalidateQueries({ queryKey: ["links"] }); // Temporary workaround
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] }); // Temporary workaround

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
};
