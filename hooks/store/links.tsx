import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
  LinkRequestQuery,
} from "@/types/global";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: LinkIncludingShortenedCollectionAndTags) => {
      const load = toast.loading(t("creating_link"));

      const response = await fetch("/api/v1/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(link),
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      toast.success(t("link_created"));

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return [data, ...oldData];
      });

      queryClient.setQueryData(["links"], (oldData: any) => {
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
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useUpdateLink = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (link: LinkIncludingShortenedCollectionAndTags) => {
      const load = toast.loading(t("updating"));

      const response = await fetch(`/api/v1/links/${link.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(link),
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      toast.success(t("updated"));

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return oldData.map((e: any) => (e.id === data.id ? data : e));
      });

      queryClient.setQueryData(["links"], (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [
            oldData.pages[0].map((e: any) => (e.id === data.id ? data : e)),
            ...oldData.pages.slice(1),
          ],
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useDeleteLink = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const load = toast.loading(t("deleting"));

      const response = await fetch(`/api/v1/links/${id}`, {
        method: "DELETE",
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      toast.success(t("deleted"));

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return oldData.filter((e: any) => e.id !== data.id);
      });

      queryClient.setQueryData(["links"], (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [
            oldData.pages[0].filter((e: any) => e.id !== data.id),
            ...oldData.pages.slice(1),
          ],
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
    onError: (error) => {
      toast.error(error.message);
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

      queryClient.setQueryData(["links"], (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [
            oldData.pages[0].map((e: any) => (e.id === data.id ? data : e)),
            ...oldData.pages.slice(1),
          ],
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
  });
};

const useBulkDeleteLinks = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkIds: number[]) => {
      const load = toast.loading(t("deleting"));

      const response = await fetch("/api/v1/links", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ linkIds }),
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return linkIds;
    },
    onSuccess: (data) => {
      toast.success(t("deleted"));

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return oldData.filter((e: any) => !data.includes(e.id));
      });

      queryClient.setQueryData(["links"], (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [
            oldData.pages[0].filter((e: any) => !data.includes(e.id)),
            ...oldData.pages.slice(1),
          ],
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useUploadFile = () => {
  const { t } = useTranslation();
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

      const load = toast.loading(t("creating"));

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

      toast.dismiss(load);

      return data.response;
    },
    onSuccess: (data) => {
      toast.success(t("created_success"));

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return [data, ...oldData];
      });

      queryClient.setQueryData(["links"], (oldData: any) => {
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
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useBulkEditLinks = () => {
  const { t } = useTranslation();
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
      const load = toast.loading(t("updating"));

      const response = await fetch("/api/v1/links", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ links, newData, removePreviousTags }),
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      toast.success(t("updated"));

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return undefined;
        return oldData.map((e: any) =>
          data.find((d: any) => d.id === e.id) ? data : e
        );
      });

      queryClient.setQueryData(["links"], (oldData: any) => {
        if (!oldData) return undefined;
        return {
          pages: [
            oldData.pages[0].map((e: any) =>
              data.find((d: any) => d.id === e.id) ? data : e
            ),
            ...oldData.pages.slice(1),
          ],
          pageParams: oldData.pageParams,
        };
      });

      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["publicLinks"] });
    },
    onError: (error) => {
      toast.error(error.message);
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
};
