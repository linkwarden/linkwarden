import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const useDashboardData = () => {
  const { status } = useSession();
  const router = useRouter();

  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const response = await fetch(`${router.basePath}/api/v2/dashboard`);
      const data = await response.json();

      return data.data;
    },
    enabled: status === "authenticated",
  });
};

export { useDashboardData };
