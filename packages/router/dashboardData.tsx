import { UpdateDashboardLayoutSchemaType } from "@linkwarden/lib/schemaValidation";
import {
  LinkIncludingShortenedCollectionAndTags,
  MobileAuth,
} from "@linkwarden/types/global";
import { anyPreservationPending } from "@linkwarden/lib/formatStats";
import { PRESERVATION_POLL_INTERVAL } from "./links";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const useDashboardData = (auth?: MobileAuth) => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth?.status;
  }

  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + "/api/v2/dashboard",
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      const data = await response.json();

      if (!response.ok)
        throw new Error(data?.response || "Failed to fetch dashboard data.");

      return data.data;
    },
    enabled: status === "authenticated",
    refetchInterval: (query) => {
      const data = query.state.data as
        | {
            links?: LinkIncludingShortenedCollectionAndTags[];
            collectionLinks?: Record<
              number,
              LinkIncludingShortenedCollectionAndTags[]
            >;
          }
        | undefined;
      if (!data) return false;
      const links = [
        ...(data.links ?? []),
        ...Object.values(data.collectionLinks ?? {}).flat(),
      ];
      return anyPreservationPending(links) ? PRESERVATION_POLL_INTERVAL : false;
    },
  });
};

const useUpdateDashboardLayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateDashboardLayoutSchemaType) => {
      const response = await fetch("/api/v2/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.response);
      }

      return data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });

      const previousData = queryClient.getQueryData(["user"]);

      queryClient.setQueryData(["user"], (oldData: any) => {
        // Filter enabled sections and preserve their order
        const enabledSections = newData
          .filter((section) => section.enabled)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return {
          ...oldData,
          dashboardSections: enabledSections,
        };
      });

      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(["user"], context?.previousData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
    },
  });
};

export { useDashboardData, useUpdateDashboardLayout };
