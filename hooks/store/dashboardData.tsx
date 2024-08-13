import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useQuery } from "@tanstack/react-query";

const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async (): Promise<LinkIncludingShortenedCollectionAndTags[]> => {
      const response = await fetch("/api/v1/dashboard");
      const data = await response.json();

      return data.response;
    },
  });
};

export { useDashboardData };
