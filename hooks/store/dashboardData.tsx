import { useQuery } from "@tanstack/react-query";
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

export { useDashboardData };
