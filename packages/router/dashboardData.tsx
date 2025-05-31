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
    mutationFn: async (layout: any) => {
      const response = await fetch("/api/v2/dashboard", {
        method: "UPDATE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(layout),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.response);
      }

      return data;
    },
  });
}

export { useDashboardData, useUpdateDashboardLayout };
