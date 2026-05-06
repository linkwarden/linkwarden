import { QueryClient, QueryKey } from "@tanstack/react-query";

const resetInfiniteQueryPagination = async (
  queryClient: QueryClient,
  queryKey: QueryKey
) => {
  await queryClient.cancelQueries({ queryKey });
  queryClient.setQueriesData({ queryKey }, (oldData: any) => {
    if (!oldData) return undefined;
    return {
      pages: oldData.pages.slice(0, 1),
      pageParams: oldData.pageParams.slice(0, 1),
    };
  });
  await queryClient.invalidateQueries({ queryKey });
};

export { resetInfiniteQueryPagination };
