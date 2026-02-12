import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { WorkerStats } from "@linkwarden/types";
import { DeletePreservationsSchemaType } from "@linkwarden/lib/schemaValidation";

const useWorker = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["worker"],
    queryFn: async () => {
      const response = await fetch("/api/v1/worker");

      if (!response.ok) throw new Error("Failed to fetch worker data.");
      const data = await response.json();

      return data.data as WorkerStats;
    },
    enabled: status === "authenticated",
  });
};

const useDeletePreservations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: DeletePreservationsSchemaType) => {
      const response = await fetch("/api/v1/worker/preservation", {
        body: JSON.stringify({
          action: payload.action,
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
      queryClient.invalidateQueries({ queryKey: ["worker"] });
    },
  });
};

export { useWorker, useDeletePreservations };
