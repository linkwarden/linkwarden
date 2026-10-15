import {
  Query,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  MobileAuth,
  ReadingListState,
  ReadingListStatus,
} from "@linkwarden/types/global";
import { withReadingListStatus } from "@linkwarden/lib/readingList";

type ReadingListUpdate = {
  linkIds: number[];
  status: ReadingListStatus | null;
};

// Link list queries opened with `useLinks({ readingList })`.
const readingListParam = (query: Pick<Query, "queryKey">) => {
  if (query.queryKey[0] !== "links") return null;
  const params = (query.queryKey[1] as { params?: string })?.params ?? "";
  return new URLSearchParams(params).get("readingList");
};

const invalidateReadingList = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["readingList"] });
  queryClient.invalidateQueries({
    predicate: (query) => readingListParam(query) !== null,
  });
};

const withoutLinks = (data: any, linkIds: number[]) =>
  data?.pages
    ? {
        ...data,
        pages: data.pages.map((page: any) => ({
          ...page,
          links: (page.links ?? []).filter(
            (link: any) => !linkIds.includes(link.id)
          ),
        })),
      }
    : data;

const useReadingList = (
  auth?: MobileAuth
): UseQueryResult<ReadingListState, Error> => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth.status;
  }

  return useQuery({
    queryKey: ["readingList"],
    queryFn: async () => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") + "/api/v1/reading-list",
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      if (!response.ok) throw new Error("Failed to fetch the reading list.");

      const data = await response.json();
      return data.response as ReadingListState;
    },
    enabled: status === "authenticated",
  });
};

const useReadingListStatus = (
  linkId?: number,
  auth?: MobileAuth
): ReadingListStatus | null => {
  const { data } = useReadingList(auth);

  if (!linkId || !data) return null;
  if (data.unread.includes(linkId)) return "unread";
  if (data.read.includes(linkId)) return "read";
  return null;
};

const useUpdateReadingList = (auth?: MobileAuth) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkIds, status }: ReadingListUpdate) => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") + "/api/v1/reading-list",
        {
          body: JSON.stringify(
            status ? { linkIds, read: status === "read" } : { linkIds }
          ),
          headers: {
            "Content-Type": "application/json",
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
          method: status ? "PUT" : "DELETE",
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onMutate: async ({ linkIds, status }) => {
      const isListQuery = (query: Query) => readingListParam(query) !== null;

      await queryClient.cancelQueries({ queryKey: ["readingList"] });
      await queryClient.cancelQueries({ predicate: isListQuery });

      const previousState = queryClient.getQueryData<ReadingListState>([
        "readingList",
      ]);
      const previousLinks = queryClient.getQueriesData({
        predicate: isListQuery,
      });

      if (previousState)
        queryClient.setQueryData(
          ["readingList"],
          withReadingListStatus(previousState, linkIds, status)
        );

      // Links leave the tab they no longer belong to right away; the tab
      // they move into picks them up on the refetch below.
      for (const [queryKey, data] of previousLinks) {
        if (readingListParam({ queryKey }) !== status)
          queryClient.setQueryData(queryKey, withoutLinks(data, linkIds));
      }

      return { previousState, previousLinks };
    },
    onError: (_error, _update, context) => {
      if (!context) return;

      if (context.previousState)
        queryClient.setQueryData(["readingList"], context.previousState);

      for (const [queryKey, data] of context.previousLinks)
        queryClient.setQueryData(queryKey, data);
    },
    onSettled: () => invalidateReadingList(queryClient),
  });
};

export {
  useReadingList,
  useReadingListStatus,
  useUpdateReadingList,
  invalidateReadingList,
};
