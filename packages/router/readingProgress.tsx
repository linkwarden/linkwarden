import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { MobileAuth } from "@linkwarden/types/global";

const useGetReadingProgress = (
  linkId?: number,
  auth?: MobileAuth,
  enabled = true
): UseQueryResult<number | null, Error> => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth.status;
  }

  return useQuery({
    queryKey: ["readingProgress", linkId],
    queryFn: async () => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") +
          `/api/v1/links/${linkId}/progress`,
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      if (!response.ok) throw new Error("Failed to fetch reading progress.");

      const data = await response.json();
      return (data.response as number | null) ?? null;
    },
    // The position can change from other devices at any time, so the cached
    // value can't be trusted on mount.
    staleTime: 0,
    refetchOnMount: "always",
    enabled: status === "authenticated" && !!linkId && enabled,
  });
};

const useUpdateReadingProgress = (linkId?: number, auth?: MobileAuth) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: number) => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") +
          `/api/v1/links/${linkId}/progress`,
        {
          body: JSON.stringify({ progress }),
          headers: {
            "Content-Type": "application/json",
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
          method: "PUT",
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return progress;
    },
    onSuccess: (progress: number) => {
      queryClient.setQueryData(["readingProgress", linkId], progress);
    },
  });
};

export { useGetReadingProgress, useUpdateReadingProgress };
