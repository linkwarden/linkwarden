import { RssSubscription } from "@prisma/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface RssSubscriptionWithCollectionName extends RssSubscription {
  collection: {
    name: string;
  };
}

const useRssSubscriptions = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["rss-subscriptions"],
    queryFn: async () => {
      const response = await fetch("/api/v1/user/rss");
      if (!response.ok) throw new Error("Failed to fetch rss subscriptions.");

      const data = await response.json();
      return data.response as RssSubscriptionWithCollectionName[];
    },
    enabled: status === "authenticated",
  });
};

const useAddRssSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<RssSubscription>) => {
      const response = await fetch("/api/v1/user/rss", {
        body: JSON.stringify(body),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["rss-subscriptions"],
        (oldData: RssSubscription[]) => [...oldData, data]
      );
    },
  });
};

const useDeleteRssSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rssSubscriptionId: number) => {
      const response = await fetch(`/api/v1/user/rss/${rssSubscriptionId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);
    },
    onSuccess: (_, rssSubscriptionId) => {
      queryClient.setQueryData(
        ["rss-subscriptions"],
        (oldData: RssSubscription[]) => {
          return oldData.filter(
            (rssSubscription) => rssSubscription.id !== rssSubscriptionId
          );
        }
      );
    },
  });
};

export { useRssSubscriptions, useAddRssSubscription, useDeleteRssSubscription };
