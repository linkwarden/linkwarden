import { UpdateDashboardLayoutSchemaType } from "@linkwarden/lib/schemaValidation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const useDashboardData = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const response = await fetch("/api/v2/dashboard");
      const data = await response.json();

      return data.data;
    },
    enabled: status === "authenticated",
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
        return {
          ...oldData,
          dashboardSections: newData.filter((section) => section.enabled),
        };
      });

      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(["user"], context?.previousData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export { useDashboardData, useUpdateDashboardLayout };
