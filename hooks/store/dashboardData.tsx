import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const useDashboardData = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async (): Promise<LinkIncludingShortenedCollectionAndTags[]> => {
      const response = await fetch("/api/v1/dashboard");
      const data = await response.json();

      return data.response;
    },
    enabled: status === "authenticated",
  });
};

export { useDashboardData };
